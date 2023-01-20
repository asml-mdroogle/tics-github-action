import { getBooleanInput, getInput, info } from '@actions/core';
import { getOctokit } from '@actions/github';
import { HttpClient } from '@actions/http-client';
import { readFileSync } from 'fs';
import { getTicsWebBaseUrlFromUrl } from './tics/api_helper';

const payload = process.env.GITHUB_EVENT_PATH ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : '';
const pullRequestNumber = payload.pull_request ? payload.pull_request.number : '';

export const githubConfig = {
  repo: process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY : '',
  owner: process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[0] : '',
  reponame: process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : '',
  branchname: process.env.GITHUB_HEAD_REF ? process.env.GITHUB_HEAD_REF : '',
  basebranchname: process.env.GITHUB_BASE_REF ? process.env.GITHUB_BASE_REF : '',
  branchdir: process.env.GITHUB_WORKSPACE ? process.env.GITHUB_WORKSPACE : '',
  eventName: process.env.GITHUB_EVENT_NAME ? process.env.GITHUB_EVENT_NAME : '',
  runnerOS: process.env.RUNNER_OS ? process.env.RUNNER_OS : '',
  pullRequestNumber: process.env.PULL_REQUEST_NUMBER ? process.env.PULL_REQUEST_NUMBER : pullRequestNumber
};

function getHostnameVerification() {
  let hostnameVerificationCfg = getInput('hostnameVerification');
  let hostnameVerification: boolean;

  if (hostnameVerificationCfg) {
    process.env.TICSHOSTNAMEVERIFICATION = hostnameVerificationCfg;
  }

  switch (process.env.TICSHOSTNAMEVERIFICATION) {
    case '0':
    case 'false':
      hostnameVerification = false;
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      info('Hostname Verification disabled');
      break;
    default:
      hostnameVerification = true;
      break;
  }
  return hostnameVerification;
}

function getTicsAuthToken(): string | undefined {
  const ticsAuthToken = getInput('ticsAuthToken');

  if (ticsAuthToken) {
    // Update the environment for TICS
    process.env.TICSAUTHTOKEN = ticsAuthToken;
  }

  return ticsAuthToken;
}

export const ticsConfig = {
  projectName: getInput('projectName', { required: true }),
  branchName: getInput('branchName'),
  branchDir: getInput('branchDir'),
  calc: getInput('calc'),
  clientData: getInput('clientData'),
  additionalFlags: getInput('additionalFlags'),
  hostnameVerification: getHostnameVerification(),
  installTics: getBooleanInput('installTics'),
  logLevel: getInput('logLevel'),
  postAnnotations: getBooleanInput('postAnnotations'),
  ticsAuthToken: getTicsAuthToken(),
  githubToken: getInput('githubToken', { required: true }),
  ticsConfiguration: getInput('ticsConfiguration', { required: true }),
  tmpDir: getInput('tmpDir'),
  viewerUrl: getInput('viewerUrl')
};

export const octokit = getOctokit(ticsConfig.githubToken);
export const httpClient = new HttpClient('http-client', [], { ignoreSslError: !ticsConfig.hostnameVerification });
export const baseUrl = getTicsWebBaseUrlFromUrl(ticsConfig.ticsConfiguration);
export const viewerUrl = ticsConfig.viewerUrl ? ticsConfig.viewerUrl.replace(/\/+$/, '') : baseUrl;
