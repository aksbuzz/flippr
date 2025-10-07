import crypto from 'crypto';
import { ConflictError, NotFoundError } from '../../common/errors';
import { db } from '../../config/database';
import { projectTasksQueue } from '../../config/queue';
import { Environment } from '../../db/models/environment';
import { FeatureFlag } from '../../db/models/feature-flag';
import { Project } from '../../db/models/project';
import { CreateEnvironment, CreateFlag, CreateProject } from './projects.types';

interface FlagResponse extends Omit<FeatureFlag, 'description' | 'off_value'> {
  environments: { id: string; is_enabled: boolean }[];
}

export class ProjectsService {
  async createProject(data: CreateProject) {
    try {
      return await db.one<Project>(
        `INSERT INTO projects (name, created_at)
         VALUES ($1, NOW())
         RETURNING id, name, created_at`,
        [data.name]
      );
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictError(`Project "${data.name}" already exists`);
      }
      throw err;
    }
  }

  async getProjects() {
    return db.manyOrNone<Project>(`SELECT id, name, created_at FROM projects ORDER BY id ASC`);
  }

  async createEnvironment(projectId: string, data: CreateEnvironment) {
    const exists = await db.oneOrNone<Project>(`SELECT id FROM projects WHERE id = $1`, [
      projectId,
    ]);
    if (!exists) throw new NotFoundError('Project not found');

    const sdkKey = `${data.name}_sdk_key_${projectId}_${crypto.randomBytes(16).toString('hex')}`;
    const newEnvironment = await db.one<Environment>(
      `INSERT INTO environments (project_id, name, sdk_key)
       VALUES ($1, $2, $3)
       RETURNING id, project_id, name, sdk_key`,
      [projectId, data.name, sdkKey]
    );

    await projectTasksQueue.add(
      'link-new-environment',
      { environmentId: newEnvironment.id, projectId: projectId },
      { removeOnComplete: true, removeOnFail: 50 }
    );

    return newEnvironment;
  }

  async getEnvironments(projectId: string) {
    return db.manyOrNone<Environment>(
      `
      SELECT id, sdk_key, project_id, name 
      FROM environments 
      WHERE project_id = $1 
      ORDER BY id ASC`,
      [projectId]
    );
  }

  async createFlag(projectId: string, data: CreateFlag) {
    return db.tx<FeatureFlag>(async tx => {
      const project = await tx.oneOrNone<Project>(`SELECT id FROM projects WHERE id = $1`, [
        projectId,
      ]);
      if (!project) throw new NotFoundError('Project not found');

      const flag = await tx.one<FeatureFlag>(
        `
        INSERT INTO feature_flags 
          (project_id, name, key, description, flag_type, off_value, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id, project_id, key, description, created_at`,
        [projectId, data.name, data.key, data.description, data.flag_type, data.off_value]
      );

      await tx.none(
        `
        INSERT INTO environment_flag_states 
          (environment_id, feature_flag_id, is_enabled)
        SELECT e.id, $1, false
        FROM environments e WHERE e.project_id = $2
        `,
        [flag.id, projectId]
      );

      return flag;
    });
  }

  async getFlags(projectId: string) {
    const rows = await db.manyOrNone(
      `
      SELECT 
        f.id as flag_id,
        f.name as flag_name,
        f.key,
        f.flag_type,
        f.created_at,
        e.id as env_id,
        s.is_enabled
      FROM feature_flags f
      LEFT JOIN environment_flag_states s ON s.feature_flag_id = f.id
      LEFT JOIN environments e ON e.id = s.environment_id
      WHERE f.project_id = $1
      ORDER BY f.id, e.id`,
      [projectId]
    );

    const grouped: Record<string, FlagResponse> = {};

    for (const row of rows) {
      if (!grouped[row.flag_id]) {
        grouped[row.flag_id] = {
          id: row.flag_id,
          project_id: projectId,
          name: row.flag_name,
          key: row.key,
          flag_type: row.flag_type,
          created_at: row.created_at,
          environments: [],
        };
      }

      if (row.env_id) {
        grouped[row.flag_id].environments.push({
          id: row.env_id,
          is_enabled: row.is_enabled,
        });
      }
    }

    return Object.values(grouped);
  }

  async getFlag(projectId: string, flagId: string) {
    const rows = await db.manyOrNone(
      `
      SELECT 
        f.id as flag_id,
        f.project_id,
        f.name AS flag_name,
        f.key AS flag_key,
        f.description AS flag_description,
        f.flag_type,
        f.off_value,
        f.created_at AS flag_created_at,
        
        v.id AS variant_id,
        v.key AS variant_key,
        v.value AS variant_value,
        v.description AS variant_description,
        v.created_at AS variant_created_at,
        
        e.id AS env_id,
        e.name AS env_name,
        s.is_enabled,
        s.serving_variant_id,
        sv.key AS serving_variant_key

      FROM feature_flags f
      LEFT JOIN feature_flag_variants v ON v.feature_flag_id = f.id
      LEFT JOIN environments e ON e.project_id = f.project_id
      LEFT JOIN environment_flag_states s ON s.environment_id = e.id AND s.feature_flag_id = f.id
      LEFT JOIN feature_flag_variants sv ON sv.id = s.serving_variant_id
      WHERE f.project_id = $1 AND f.id = $2
      ORDER BY v.created_at ASC, e.name ASC;
      `,
      [projectId, flagId]
    );

    if (!rows.length) throw new NotFoundError('Flag not found');

    const first = rows[0];

    const variantsMap = new Map<string, any>();
    for (const r of rows) {
      if (r.variant_id && !variantsMap.has(r.variant_id)) {
        variantsMap.set(r.variant_id, {
          id: r.variant_id,
          key: r.variant_key,
          value: r.variant_value,
          description: r.variant_description,
          created_at: r.variant_created_at,
        });
      }
    }

    const envMap = new Map<string, any>();
    for (const r of rows) {
      if (r.env_id && !envMap.has(r.env_id)) {
        envMap.set(r.env_id, {
          id: r.env_id,
          name: r.env_name,
          is_enabled: r.is_enabled ?? false,
          serving_variant_id: r.serving_variant_id,
          serving_variant_key: r.serving_variant_key,
        });
      }
    }

    return {
      id: first.flag_id,
      project_id: first.project_id,
      name: first.flag_name,
      key: first.flag_key,
      description: first.description,
      flag_type: first.flag_type,
      off_variant_value: first.off_variant_value,
      created_at: first.flag_created_at,
      variants: Array.from(variantsMap.values()),
      environments: Array.from(envMap.values()),
    };
  }
}
