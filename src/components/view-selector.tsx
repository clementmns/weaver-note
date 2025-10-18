"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Columns2, Eye, Pencil } from "lucide-react";
import { ViewMode } from "@/types/global";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ViewSelectorProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const ViewSelector: React.FC<ViewSelectorProps> = ({
  viewMode,
  setViewMode,
}) => {
  return (
    <div>
      <div className="hidden sm:flex items-center gap-4">
        <Tabs
          defaultValue={viewMode}
          onValueChange={(value: string) => setViewMode(value as ViewMode)}
        >
          <TabsList>
            <TabsTrigger value={ViewMode.BOTH}>
              <Columns2 />
              Both
            </TabsTrigger>
            <TabsTrigger value={ViewMode.EDIT}>
              <Pencil />
              Edit
            </TabsTrigger>
            <TabsTrigger value={ViewMode.VIEW}>
              <Eye />
              View
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="sm:hidden w-full">
        <Select
          value={viewMode}
          onValueChange={(value: string) => setViewMode(value as ViewMode)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ViewMode.BOTH}>
              <Columns2 />
              Both
            </SelectItem>
            <SelectItem value={ViewMode.EDIT}>
              <Pencil />
              Edit
            </SelectItem>
            <SelectItem value={ViewMode.VIEW}>
              <Eye />
              View
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ViewSelector;
