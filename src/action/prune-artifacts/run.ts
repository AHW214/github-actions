import * as core from '@actions/core';
import { context as globalContext } from '@actions/github';

import { attempt } from 'control/run';

attempt(() => {
  core.info(JSON.stringify(globalContext));
});
