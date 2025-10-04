import { NextFunction, Request, Response } from 'express';
import { okResponse } from '../common';
import { CreateEnvironmentSchema, CreateFlagSchema, CreateProjectSchema } from './projects.schema';
import { ProjectsService } from './projects.service';

export class ProjectsController {
  constructor(private readonly projectsService = new ProjectsService()) {}

  createProject = async (
    req: Request<{}, any, CreateProjectSchema>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const project = await this.projectsService.createProject(req.body);
      res.status(201).json(okResponse(project));
    } catch (err: any) {
      next(err);
    }
  };

  getProjects = async (_: Request, res: Response, next: NextFunction) => {
    try {
      const projects = await this.projectsService.getProjects();
      res.status(200).json(okResponse(projects));
    } catch (error) {
      next(error);
    }
  };

  createEnvironment = async (
    req: Request<{ projectId: string }, any, CreateEnvironmentSchema>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const projectId = req.params.projectId;
      const env = await this.projectsService.createEnvironment(projectId, req.body);
      res.status(201).json(okResponse(env));
    } catch (err: any) {
      next(err);
    }
  };

  getEnvironments = async (
    req: Request<{ projectId: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const projectId = req.params.projectId;
      const environments = await this.projectsService.getEnvironments(projectId);
      res.status(200).json(okResponse(environments));
    } catch (err: any) {
      next(err);
    }
  };

  createFlag = async (
    req: Request<{ projectId: string }, any, CreateFlagSchema>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const projectId = req.params.projectId;
      const flag = await this.projectsService.createFlag(projectId, req.body);
      res.status(201).json(okResponse(flag));
    } catch (err: any) {
      next(err);
    }
  };

  getFlags = async (req: Request<{ projectId: string }>, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId;
      const flags = await this.projectsService.getFlags(projectId);
      res.status(200).json(okResponse(flags));
    } catch (err: any) {
      next(err);
    }
  };
}
