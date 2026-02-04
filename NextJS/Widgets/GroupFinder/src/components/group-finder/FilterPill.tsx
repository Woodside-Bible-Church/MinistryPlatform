"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface FilterPillProps {
  icon?: IconDefinition;
  label: string;
  prefix?: string;
  filter: string;
  id: string | number;
  loading?: boolean;
  onRemove: (filter: string, id: string | number) => void;
}

export default function FilterPill({
  icon,
  label,
  prefix,
  filter,
  id,
  loading,
  onRemove,
}: FilterPillProps) {
  return (
    <li>
      <a
        className={`filterBtn${loading ? " loading-pill" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          onRemove(filter, id);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onRemove(filter, id);
          }
        }}
      >
        {icon && <FontAwesomeIcon icon={icon} style={{ marginRight: "0.4em" }} />}
        <span>
          {prefix ? `${prefix}: ` : ""}
          {label}
        </span>
        <span className="blur">
          <FontAwesomeIcon icon={faTrash} />
        </span>
      </a>
    </li>
  );
}
