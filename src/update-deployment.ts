// Heavily based on https://github.com/chrnorm/deployment-status originally

import * as core from '@actions/core';
import * as github from '@actions/github';

type DeploymentState =
    | 'error'
    | 'failure'
    | 'inactive'
    | 'in_progress'
    | 'queued'
    | 'pending'
    | 'success';

async function run() {
    try {
        const context = github.context;
        const logUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${context.sha}/checks`;

        const token = core.getInput('token', {required: true});
        const url = core.getInput('target_url', {required: false}) || logUrl;
        const deploymentId = core.getInput('deployment_id', {required: true});
        const state = core.getInput('state', {required: true}) as DeploymentState;

        const octokit = github.getOctokit(token, {mediaTypes: {previews: ['flash']}});

        await octokit.rest.repos.createDeploymentStatus({
            ...context.repo,
            deployment_id: parseInt(deploymentId),
            state,
            log_url: logUrl,
            target_url: url,
            environment_url: url,
        });
    } catch (error) {
        core.error(error as any);
        core.setFailed((error as any).message);
    }
}

run();
