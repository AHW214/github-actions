export { Context };

import type { GetType } from 'purify-ts';
import { Codec, exactly, nonEmptyList, number } from 'purify-ts';

import type { ContextOf } from 'data/context';

type Context = ContextOf<GetType<typeof Context>>;

const Context = Codec.interface({
  eventName: exactly('workflow_run'),
  payload: Codec.interface({
    workflow_run: Codec.interface({
      event: exactly('pull_request'),
      id: number,
      check_suite_id: number,
      pull_requests: nonEmptyList(
        Codec.interface({
          number,
        }),
      ),
    }),
  }),
});
