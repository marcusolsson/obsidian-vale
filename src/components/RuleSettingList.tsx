import React from "react";
import { ValeRule } from "../types";
import { RuleSetting } from "./RuleSetting";

interface Props {
  rules: ValeRule[];
  onChange: (rule: ValeRule) => void;
}

export const RuleSettingList = ({
  rules,
  onChange,
}: Props): React.ReactElement => {
  return (
    <div>
      {rules.map((rule, idx) => (
        <RuleSetting
          key={`${rule.name}-${idx}`}
          value={rule}
          onChange={onChange}
        />
      ))}
    </div>
  );
};
