"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { Children, isValidElement, type ReactNode } from "react";
import "./Tabs.css";

export interface TabProps {
  label: string;
  children: ReactNode;
}

// Marker component — never rendered directly; props are consumed by <Tabs>
export function Tab(_: TabProps): null {
  return null;
}

export interface TabsProps {
  defaultValue?: string;
  children: ReactNode;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function Tabs({ defaultValue, children }: TabsProps) {
  const tabElements = Children.toArray(children).filter(
    (child): child is React.ReactElement<TabProps> =>
      isValidElement(child) && typeof (child.props as TabProps).label === "string",
  );

  const items = tabElements.map((el) => {
    const props = el.props as TabProps;
    return {
      label: props.label,
      value: slugify(props.label),
      content: props.children,
    };
  });

  const initial = defaultValue !== undefined ? slugify(defaultValue) : (items[0]?.value ?? "");

  return (
    <TabsPrimitive.Root className="cooper-tabs-root" defaultValue={initial}>
      <TabsPrimitive.List className="cooper-tabs-list" aria-label="Tabs">
        {items.map((it) => (
          <TabsPrimitive.Trigger key={it.value} className="cooper-tabs-trigger" value={it.value}>
            {it.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((it) => (
        <TabsPrimitive.Content key={it.value} className="cooper-tabs-content" value={it.value}>
          {it.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
