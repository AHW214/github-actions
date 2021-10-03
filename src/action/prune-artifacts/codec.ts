export { Context };

import type { GetType } from 'purify-ts';
import { Codec, exactly, oneOf, string } from 'purify-ts';

import type { ContextOf } from 'data/context';

type Context = ContextOf<GetType<typeof Context>>;

const DeleteContext = Codec.interface({
  eventName: exactly('delete'),
  payload: Codec.interface({
    ref: string,
    ref_type: exactly('branch'),
  }),
});

const WorkflowRunContext = Codec.interface({
  eventName: exactly('workflow_run'),
  payload: Codec.interface({
    workflow_run: Codec.interface({
      event: exactly('push'),
      head_branch: string,
    }),
  }),
});

const Context = oneOf([DeleteContext, WorkflowRunContext]);
