export type { IssueComment };
export { authorIsBot };

import type { Awaited } from 'util/type';
import type { GithubClient } from 'data/github-client';

type IssueComment = Awaited<
  ReturnType<GithubClient['rest']['issues']['listComments']>
>['data'][0];

const authorIsBot = (comment: IssueComment): boolean =>
  comment.user?.login === 'github-actions[bot]';
