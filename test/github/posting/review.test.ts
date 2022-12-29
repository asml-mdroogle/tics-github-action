import { githubConfig, octokit } from '../../../src/configuration';
import { postReview } from '../../../src/github/posting/review';
import { createFilesSummary, createLinkSummary, createUnpostableReviewCommentsSummary, createQualityGateSummary } from '../../../src/helper/summary';
import { Events } from '../../../src/helper/enums';
import Logger from '../../../src/helper/logger';

jest.mock('../../../src/helper/summary', () => {
  return {
    createQualityGateSummary: jest.fn(),
    createLinkSummary: jest.fn(),
    createUnpostableReviewCommentsSummary: jest.fn(),
    createFilesSummary: jest.fn()
  };
});

describe('postReview', () => {
  test('Should call postReview once', async () => {
    (createQualityGateSummary as any).mockReturnValueOnce('GateSummary...\n');
    (createLinkSummary as any).mockReturnValueOnce('LinkSummary...\n');
    (createFilesSummary as any).mockReturnValueOnce('FilesSummary...\n');

    const spy = jest.spyOn(octokit.rest.pulls, 'createReview');

    const analysis = {
      completed: true,
      errorList: ['error1'],
      warningList: [],
      statusCode: 0,
      explorerUrl: 'url'
    };
    const qualityGate = {
      passed: true,
      message: 'message',
      url: 'url',
      gates: [],
      annotationsApiV1Links: []
    };
    await postReview(analysis, [''], qualityGate, undefined);
    expect(spy).toBeCalledTimes(1);
  });

  test('Should call postReview with values passed and no comments', async () => {
    (createQualityGateSummary as any).mockReturnValueOnce('GateSummary...\n');
    (createLinkSummary as any).mockReturnValueOnce('LinkSummary...\n');
    (createFilesSummary as any).mockReturnValueOnce('FilesSummary...\n');

    const spy = jest.spyOn(octokit.rest.pulls, 'createReview');

    const analysis = {
      completed: true,
      errorList: ['error1'],
      warningList: [],
      statusCode: 0,
      explorerUrl: 'url'
    };
    const qualityGate = {
      passed: true,
      message: 'message',
      url: 'url',
      gates: [],
      annotationsApiV1Links: []
    };
    await postReview(analysis, [''], qualityGate, undefined);
    const calledWith = {
      owner: githubConfig.owner,
      repo: githubConfig.reponame,
      pull_number: githubConfig.pullRequestNumber,
      event: Events.APPROVE,
      body: 'GateSummary...\nLinkSummary...\nFilesSummary...\n',
      comments: undefined
    };
    expect(spy).toBeCalledWith(calledWith);
  });

  test('Should call postReview with values failed', async () => {
    (createQualityGateSummary as any).mockReturnValueOnce('GateSummary...\n');
    (createLinkSummary as any).mockReturnValueOnce('LinkSummary...\n');
    (createUnpostableReviewCommentsSummary as any).mockReturnValueOnce('UnpostableSummary...\n');
    (createFilesSummary as any).mockReturnValueOnce('FilesSummary...\n');

    const spy = jest.spyOn(octokit.rest.pulls, 'createReview');

    const analysis = {
      completed: true,
      errorList: ['error1'],
      warningList: [],
      statusCode: 0,
      explorerUrl: 'url'
    };
    const qualityGate = {
      passed: false,
      message: 'message',
      url: 'url',
      gates: [],
      annotationsApiV1Links: []
    };
    const reviewComments = {
      postable: [],
      unpostable: [{}]
    };
    await postReview(analysis, [''], qualityGate, reviewComments);
    const calledWith = {
      owner: githubConfig.owner,
      repo: githubConfig.reponame,
      pull_number: githubConfig.pullRequestNumber,
      event: Events.REQUEST_CHANGES,
      body: 'GateSummary...\nLinkSummary...\nUnpostableSummary...\nFilesSummary...\n',
      comments: []
    };
    expect(spy).toBeCalledWith(calledWith);
  });

  test('Should throw an error on postErrorComment', async () => {
    (createQualityGateSummary as any).mockReturnValueOnce('GateSummary...\n');
    (createLinkSummary as any).mockReturnValueOnce('LinkSummary...\n');
    (createUnpostableReviewCommentsSummary as any).mockReturnValueOnce('UnpostableSummary...\n');
    (createFilesSummary as any).mockReturnValueOnce('FilesSummary...\n');

    jest.spyOn(octokit.rest.pulls, 'createReview').mockImplementationOnce(() => {
      throw new Error();
    });
    const spy = jest.spyOn(Logger.Instance, 'error');

    const analysis = {
      completed: false,
      errorList: ['error1'],
      warningList: [],
      statusCode: 0,
      explorerUrl: undefined
    };
    const qualityGate = {
      passed: true,
      message: 'message',
      url: 'url',
      gates: [],
      annotationsApiV1Links: []
    };
    await postReview(analysis, [''], qualityGate, undefined);

    expect(spy).toBeCalledTimes(1);
  });
});
