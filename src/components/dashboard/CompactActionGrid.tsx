import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ActionItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary";
}

interface CompactActionGridProps {
  title: string;
  titleIcon: LucideIcon;
  actions: ActionItem[];
}

const CompactActionGrid = memo(({ title, titleIcon: TitleIcon, actions }: CompactActionGridProps) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <TitleIcon className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            onClick={action.onClick}
            variant={action.variant || "outline"}
            className="w-full justify-start h-12 text-base"
          >
            <action.icon className="mr-3 h-5 w-5" />
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
});

CompactActionGrid.displayName = 'CompactActionGrid';

export default CompactActionGrid;