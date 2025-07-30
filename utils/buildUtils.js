const { execSync } = require('child_process');
const fs = require('fs');
const { commitAndPushChanges } = require('./gitUtils');

/**
 * Build project, commit changes, and upload to S3 dev environment
 * @param {Object} options - Configuration options
 * @param {string} options.commitMessage - Git commit message
 * @param {string} options.projectPath - Path to project directory (default: './project')
 * @param {Function} options.statusCallback - Optional callback for status updates
 * @returns {Object} Result object with success status and details
 */
function buildAndDeploy({ commitMessage = 'Update configuration', projectPath = './project', statusCallback = null } = {}) {
    try {
        // Send status update if callback provided
        if (statusCallback) {
            statusCallback({
                type: 'status',
                message: 'Starting build process...',
                timestamp: new Date().toISOString()
            });
        }

        // Execute build
        const buildResult = execSync('npm run build', { cwd: projectPath });
        console.log('Build output:', buildResult.toString());

        if (statusCallback) {
            statusCallback({
                type: 'status',
                message: 'Build complete. Committing changes...',
                timestamp: new Date().toISOString()
            });
        }

        // Commit and push to Github
        const gitResult = commitAndPushChanges({ commitMessage });
        if (!gitResult.success) {
            console.warn('Git operation failed:', gitResult.message);
        }

        if (statusCallback) {
            statusCallback({
                type: 'status',
                message: 'Changes committed. Uploading to S3 dev...',
                timestamp: new Date().toISOString()
            });
        }

        // Upload to S3 dev environment
        const appName = process.env.APP_NAME || 'default-app';
        const s3UploadResult = execSync(`aws s3 sync dist/ s3://manifest-frontends-dev/${appName}/ --delete`, { 
            cwd: projectPath 
        });
        console.log('S3 upload output:', s3UploadResult.toString());

        if (statusCallback) {
            statusCallback({
                type: 'complete',
                message: 'Build and deployment completed successfully',
                status: 'success',
                timestamp: new Date().toISOString()
            });
        }

        return {
            success: true,
            message: 'Build and deployment completed successfully',
            details: {
                build: buildResult.toString(),
                git: gitResult,
                s3Upload: s3UploadResult.toString()
            }
        };

    } catch (error) {
        console.error('Error in build and deploy:', error);
        
        if (statusCallback) {
            statusCallback({
                type: 'error',
                error: 'Build and deployment failed',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }

        return {
            success: false,
            message: 'Build and deployment failed',
            error: error.message
        };
    }
}

module.exports = {
    buildAndDeploy
};