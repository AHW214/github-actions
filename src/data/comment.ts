export { IssueComment, authorIsBot };

import type { GithubClient } from './github-client';
import type { Awaited } from '../util/type';

type IssueComment = Awaited<
  ReturnType<GithubClient['rest']['issues']['listComments']>
>['data'][0];

const authorIsBot = (comment: IssueComment): boolean =>
  comment.user?.login === 'github-actions[bot]';
