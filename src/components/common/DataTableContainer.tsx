import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface DataTableContainerProps {
  children: ReactNode;
}

export function DataTableContainer({ children }: DataTableContainerProps) {
  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">{children}</CardContent>
    </Card>
  );
}
