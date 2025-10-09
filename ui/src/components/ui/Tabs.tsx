import {
  Tab as HTab,
  TabGroup as HTabGroup,
  TabList as HTabList,
  TabPanel as HTabPanel,
  TabPanels as HTabPanels,
  type TabListProps,
  type TabPanelProps,
  type TabPanelsProps,
  type TabProps,
} from '@headlessui/react';
import { cn } from '../../utils/cn';
import type React from 'react';

export const TabGroup = HTabGroup;
TabGroup.displayName = 'TabGroup';

export const TabList = (props: TabListProps) => {
  const { className, children, ...rest } = props;

  return (
    <HTabList className={cn('flex border-b border-gray-200', className)} {...rest}>
      {children}
    </HTabList>
  );
};
TabList.displayName = 'TabList';

export const Tab = (props: TabProps) => {
  const { className, children, ...rest } = props;

  return (
    <HTab
      className={({ selected }) =>
        cn(
          'border-b-2 px-4 py-2 text-sm font-medium outline-none',
          '-mb-px',
          selected
            ? 'border-primary text-primary'
            : 'border-transparent text-dark hover:border-gray-300 hover:text-gray-700',
          className
        )
      }
      {...rest}
    >
      {children}
    </HTab>
  );
};
Tab.displayName = 'Tab';

export const TabPanels = (props: TabPanelsProps) => {
  const { className, children, ...rest } = props;
  return (
    <HTabPanels className={cn('mt-2', className)} {...rest}>
      {children}
    </HTabPanels>
  );
};
TabPanels.displayName = 'TabPanels';

export const TabPanel = (props: TabPanelProps) => {
  const { className, children, ...rest } = props;
  return (
    <HTabPanel className={cn('text-sm text-gray-700 outline-none', className)} {...rest}>
      {children}
    </HTabPanel>
  );
};

type TabsProps = {
  tabs: {
    label: string;
    content: React.ReactNode;
  }[];
}

export const Tabs = (props: TabsProps) => {
  const { tabs } = props;
  if (!tabs || tabs.length === 0) return null

  return (
    <TabGroup>
      <TabList>
        {tabs.map((tab) => (
          <Tab key={tab.label}>{tab.label}</Tab>
        ))}
      </TabList>
      <TabPanels>
        {tabs.map((tab) => (
          <TabPanel key={tab.label}>{tab.content}</TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  )
}
Tabs.displayName = 'Tabs';
