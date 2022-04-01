// Heavily based on https://github.com/chrnorm/deployment-action originally

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

async function run(): Promise<void> {
    try {
        const context = github.context;
        const logUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${context.sha}/checks`;

        const token = core.getInput('token', {required: true});
        const environment = core.getInput('environment', {required: true});
        const url = core.getInput('target_url', {required: false}) || logUrl;
        const initialStatus =
            (core.getInput('initial_status', {
                required: false,
            }) as DeploymentState) || 'pending';

        const octokit = github.getOctokit(token, {mediaTypes: {previews: ['flash']}});

        const deployment = await octokit.rest.repos.createDeployment({
            owner: context.repo.owner,
            repo: context.repo.repo,
            ref: context.ref,
            required_contexts: [],
            environment,
            transient_environment: true,
        });

        if (deployment.status === 202) {
            throw new Error('Creating deployment resulted in merge result. Not supported');
        }

        await octokit.rest.repos.createDeploymentStatus({
            ...context.repo,
            deployment_id: deployment.data.id,
            state: initialStatus,
            log_url: logUrl,
            environment_url: url,
        });

        core.setOutput('deployment_id', deployment.data.id.toString());
    } catch (error) {
        core.error(error as any);
        core.setFailed((error as any).message);
    }
}

run();
