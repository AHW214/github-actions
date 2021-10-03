import * as core from '@actions/core';
import * as fs from 'fs';
import mustache from 'mustache';

import { attempt } from 'control/run';
import { getInputOneOf, getInputRequired } from 'data/github-client';
import { parseObject } from 'data/yaml';

type TemplateInput = { name: 'template-text' | 'template-path'; value: string };

const run = (
  templateInput: TemplateInput,
  templateOutputPath: string,
  templateVariablesYaml: string,
): void =>
  parseObject(templateVariablesYaml).caseOf({
    Left: (err) => {
      return core.setFailed(`Could not parse template variables: ${err}`);
    },

    Right: (variables) => {
      const template =
        templateInput.name === 'template-path'
          ? fs.readFileSync(templateInput.value, 'utf-8')
          : templateInput.value;

      const rendered = mustache.render(template, variables);

      core.info(`Writing template to ${templateOutputPath}`);

      return fs.writeFileSync(templateOutputPath, rendered, 'utf-8');
    },
  });

attempt(() => {
  const templateInput = getInputOneOf('template-text', 'template-path');
  const templateOutputPath = getInputRequired('output-path');
  const templateVariablesYaml = getInputRequired('template-variables');

  if (templateInput.type === 'None')
    return core.setFailed('Template source not specified.');

  if (templateInput.type === 'Many')
    return core.setFailed(`Can only set one of ${templateInput.names}`);

  return run(templateInput, templateOutputPath, templateVariablesYaml);
});
