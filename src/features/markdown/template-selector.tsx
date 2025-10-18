"use client";

import React from "react";
import { Button } from "../../components/ui/button";
import { DialogTitle } from "../../components/ui/dialog";

const markdownTemplates = [
  {
    id: 1,
    name: "PROSIT",
    content:
      "## Mots clés :\n### Inconnus:\n-\n\n### Clés:\n-\n\n## Contexte :\n\n\n## Problématique :\n\n\n## Contraintes :\n-\n\n## Généralisation :\n\n\n## Livrable :\n-\n\n## Pistes de solutions :\n-\n\n## Plan d'action :\n1.\n2.\n3.\n\n## Ressources :\n- [Titre de la ressource](lien)\n- \n\n## Notes supplémentaires :\n\n",
  },
];

export default function TemplateSelector({
  onSelect,
}: {
  onSelect: (templateContent: string) => void;
}) {
  return (
    <>
      <DialogTitle className="mb-4">Select a Template</DialogTitle>
      <ul className="space-y-2">
        {markdownTemplates.map((template) => (
          <li key={template.id}>
            <Button
              size="lg"
              className="w-full"
              onClick={() => onSelect(template.content)}
            >
              {template.name}
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
}

export { markdownTemplates };
