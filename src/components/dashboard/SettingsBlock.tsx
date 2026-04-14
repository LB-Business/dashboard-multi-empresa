import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface SettingsBlockProps {
  title: string;
  description: string;
  children: ReactNode;
  footerNote?: string;
  onSave?: () => void;
  saving?: boolean;
}

export function SettingsBlock({ title, description, children, footerNote, onSave, saving }: SettingsBlockProps) {
  return (
    <div className="settings-block animate-fade-in">
      <div className="settings-block-body space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        {children}
      </div>
      <div className="settings-block-footer">
        <p className="text-xs text-muted-foreground">{footerNote || ""}</p>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? "Guardando..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
