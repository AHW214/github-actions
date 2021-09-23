export { Payload, decode, isDeletePayload };

import { Codec, GetType, exactly, oneOf, string } from 'purify-ts';

import { decodeWith } from 'data/context';

type DeletePayload = GetType<typeof DeletePayload>;

type WorkflowRunPayload = GetType<typeof WorkflowRunPayload>;

type Payload = DeletePayload | WorkflowRunPayload;

// TODO - meh
const isDeletePayload = (payload: Payload): payload is DeletePayload =>
  'ref' in payload;

const DeletePayload = Codec.interface({
  ref: string,
  ref_type: exactly('branch'),
});

const WorkflowRun = Codec.interface({
  event: exactly('push'),
  head_branch: string,
});

const WorkflowRunPayload = Codec.interface({
  workflow_run: WorkflowRun,
});

const Payload = oneOf([DeletePayload, WorkflowRunPayload]);

const decode = decodeWith(Payload);
