"""Daytona SDK integration for sandbox management"""

import os
import json
import logging
import tempfile
from typing import Dict, Any
from daytona import AsyncDaytona, DaytonaConfig

logger = logging.getLogger(__name__)


class DaytonaClient:
    """Client for Daytona SDK operations"""

    def __init__(self):
        # Initialize Daytona SDK with explicit configuration
        api_key = os.getenv("DAYTONA_API_KEY")
        api_url = os.getenv("DAYTONA_API_URL", "https://app.daytona.io/api")
        target = os.getenv("DAYTONA_TARGET", "us")

        if not api_key:
            logger.error("DAYTONA_API_KEY not set. Daytona client will not function.")
            raise ValueError("DAYTONA_API_KEY is required for DaytonaClient")

        try:
            # Create configuration
            config = DaytonaConfig(api_key=api_key, api_url=api_url, target=target)

            # Initialize async client
            self.client = AsyncDaytona(config)
            logger.info(
                f"✅ Daytona SDK client initialized (URL: {api_url}, Target: {target})"
            )
        except Exception as e:
            logger.error(f"Failed to initialize Daytona SDK: {e}")
            raise

        # Track active sandboxes for cleanup (Dict: sandbox_id -> sandbox object)
        self.active_sandboxes: Dict[str, Any] = {}

    async def create_workspace(self, name: str) -> Dict[str, Any]:
        """Create a new Daytona sandbox"""
        try:
            logger.info(f"Creating Daytona sandbox: {name}")

            # Create sandbox using official async SDK
            sandbox = await self.client.create()

            # Get sandbox ID
            sandbox_id = sandbox.id if hasattr(sandbox, "id") else name

            # Track this sandbox
            self.active_sandboxes[sandbox_id] = sandbox

            logger.info(
                f"Created sandbox: {sandbox_id} (total active: {len(self.active_sandboxes)})"
            )

            return {
                "id": sandbox_id,
                "name": name,
                "status": "running",
                "sandbox": sandbox,  # Store the actual sandbox object
            }
        except Exception as e:
            logger.error(f"Failed to create sandbox '{name}': {e}")
            raise

    async def upload_file(
        self, workspace_id: str, file_path: str, content: str
    ) -> None:
        """Upload a file to the sandbox"""
        try:
            # Find the sandbox object
            sandbox = self._get_sandbox(workspace_id)
            if not sandbox:
                raise Exception(f"Sandbox {workspace_id} not found")

            logger.info(
                f"Uploading file '{file_path}' ({len(content)} bytes) to sandbox {workspace_id}"
            )

            # Write content to a temporary file
            with tempfile.NamedTemporaryFile(
                mode="w", delete=False, suffix=".tmp"
            ) as tmp_file:
                tmp_file.write(content)
                tmp_file_path = tmp_file.name

            try:
                # Upload the temporary file to sandbox (source, destination)
                await sandbox.fs.upload_file(tmp_file_path, file_path)
                logger.info(f"✅ Uploaded '{file_path}' to sandbox {workspace_id}")
            finally:
                # Clean up the temporary file
                if os.path.exists(tmp_file_path):
                    os.unlink(tmp_file_path)

        except Exception as e:
            logger.error(
                f"Failed to upload file '{file_path}' to sandbox '{workspace_id}': {e}"
            )
            raise

    async def execute_command(self, workspace_id: str, command: str) -> Dict[str, Any]:
        """Execute a command in the sandbox"""
        try:
            sandbox = self._get_sandbox(workspace_id)
            if not sandbox:
                raise Exception(f"Sandbox {workspace_id} not found")

            logger.info(f"Executing command in sandbox {workspace_id}: {command}")

            # Execute command using sandbox.process.exec() (async)
            response = await sandbox.process.exec(command)

            exit_code = response.exit_code if hasattr(response, "exit_code") else 0
            output = response.result if hasattr(response, "result") else str(response)

            if exit_code != 0:
                logger.warning(f"Command exited with code {exit_code}")

            return {"output": output, "exitCode": exit_code}
        except Exception as e:
            logger.error(
                f"Failed to execute command '{command}' in sandbox '{workspace_id}': {e}"
            )
            raise

    async def download_file(self, workspace_id: str, file_path: str) -> str:
        """Download a file from the sandbox"""
        try:
            sandbox = self._get_sandbox(workspace_id)
            if not sandbox:
                raise Exception(f"Sandbox {workspace_id} not found")

            logger.info(f"Downloading file '{file_path}' from sandbox {workspace_id}")

            # Download file from sandbox filesystem (async)
            content = await sandbox.fs.download_file(file_path)

            logger.info(f"Downloaded file '{file_path}' ({len(content)} bytes)")
            return content
        except Exception as e:
            logger.error(
                f"Failed to download file '{file_path}' from sandbox '{workspace_id}': {e}"
            )
            raise

    async def delete_workspace(self, workspace_id: str) -> None:
        """Delete a sandbox"""
        try:
            sandbox = self._get_sandbox(workspace_id)
            if not sandbox:
                logger.warning(f"Sandbox {workspace_id} not found for deletion")
                return

            # Delete the sandbox (async)
            await sandbox.delete()

            # Remove from tracking
            self.active_sandboxes.pop(workspace_id, None)
            logger.info(
                f"Deleted sandbox {workspace_id} (remaining: {len(self.active_sandboxes)})"
            )
        except Exception as e:
            logger.warning(f"Failed to delete sandbox '{workspace_id}': {e}")
            # Still remove from tracking
            self.active_sandboxes.pop(workspace_id, None)

    async def cleanup_all(self) -> None:
        """Cleanup all tracked sandboxes"""
        if not self.active_sandboxes:
            logger.info("No active sandboxes to cleanup")
            return

        logger.info(f"Cleaning up {len(self.active_sandboxes)} active sandboxes")

        for sandbox_id in list(self.active_sandboxes.keys()):
            try:
                await self.delete_workspace(sandbox_id)
            except Exception as e:
                logger.error(f"Error cleaning up sandbox {sandbox_id}: {e}")

        logger.info("Sandbox cleanup completed")

    async def close(self):
        """Close the Daytona client"""
        logger.info("Closing Daytona client")

    def _get_sandbox(self, workspace_id: str):
        """Get sandbox object by ID"""
        return self.active_sandboxes.get(workspace_id)
