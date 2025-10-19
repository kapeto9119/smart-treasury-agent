"""Daytona SDK integration for sandbox management"""

import os
import json
import logging
import tempfile
from typing import Dict, Any, Optional
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

    async def create_workspace(
        self, 
        name: str, 
        autostop_minutes: int = 10,
        snapshot_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new Daytona sandbox with auto-stop interval

        Args:
            name: Sandbox name
            autostop_minutes: Minutes of inactivity before auto-stop (0 to disable)
            snapshot_id: Optional snapshot ID to create from (faster startup)
        """
        try:
            logger.info(f"Creating Daytona sandbox: {name}")

            # Create sandbox (from snapshot if provided)
            if snapshot_id:
                try:
                    # Try to import CreateSandboxFromSnapshotParams
                    from daytona import CreateSandboxFromSnapshotParams
                    
                    params = CreateSandboxFromSnapshotParams(snapshot_id=snapshot_id)
                    sandbox = await self.client.create(params)
                    logger.info(f"✅ Created sandbox from snapshot: {snapshot_id}")
                except ImportError:
                    logger.warning("CreateSandboxFromSnapshotParams not available, creating fresh sandbox")
                    sandbox = await self.client.create()
                except Exception as e:
                    logger.warning(f"Failed to create from snapshot, using fresh sandbox: {e}")
                    sandbox = await self.client.create()
            else:
                # Create fresh sandbox
                sandbox = await self.client.create()

            # Get sandbox ID
            sandbox_id = sandbox.id if hasattr(sandbox, "id") else name

            # Set auto-stop interval (prevents runaway costs)
            if autostop_minutes > 0:
                autostop_seconds = autostop_minutes * 60
                try:
                    await sandbox.set_autostop_interval(autostop_seconds)
                    logger.info(
                        f"✅ Auto-stop set to {autostop_minutes} minutes for sandbox {sandbox_id}"
                    )
                except Exception as e:
                    logger.warning(f"⚠️  Failed to set auto-stop interval: {e}")
            else:
                logger.info(f"⚠️  Auto-stop disabled for sandbox {sandbox_id}")

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

    async def check_sandbox_health(self, workspace_id: str) -> bool:
        """
        Check if sandbox is healthy and responsive

        Returns:
            True if sandbox is healthy, False otherwise
        """
        try:
            sandbox = self._get_sandbox(workspace_id)
            if not sandbox:
                logger.warning(f"Sandbox {workspace_id} not found in tracking")
                return False

            # Try a simple command to verify sandbox is responsive
            result = await sandbox.process.exec("echo 'health_check'")
            exit_code = getattr(result, "exit_code", 1)

            if exit_code == 0:
                logger.debug(f"✅ Sandbox {workspace_id} health check passed")
                return True
            else:
                logger.warning(
                    f"⚠️  Sandbox {workspace_id} health check failed (exit code: {exit_code})"
                )
                return False

        except Exception as e:
            logger.error(f"❌ Sandbox {workspace_id} health check error: {e}")
            return False

    async def upload_file(
        self, workspace_id: str, file_path: str, content: str
    ) -> None:
        """Upload a file to the sandbox"""
        try:
            # Find the sandbox object
            sandbox = self._get_sandbox(workspace_id)
            if not sandbox:
                raise Exception(f"Sandbox {workspace_id} not found")

            # Health check before operation
            is_healthy = await self.check_sandbox_health(workspace_id)
            if not is_healthy:
                logger.warning(
                    f"⚠️  Sandbox {workspace_id} may not be responsive, attempting operation anyway..."
                )

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
        """
        Execute a command in the sandbox with enhanced error handling

        Returns:
            Dict with output, stderr, and exitCode
        """
        try:
            sandbox = self._get_sandbox(workspace_id)
            if not sandbox:
                raise Exception(f"Sandbox {workspace_id} not found")

            logger.info(f"Executing command in sandbox {workspace_id}: {command}")

            # Execute command using sandbox.process.exec() (async)
            response = await sandbox.process.exec(command)

            # Use getattr for safer attribute access
            exit_code = getattr(response, "exit_code", 0)
            stdout = getattr(response, "result", "")
            stderr = getattr(response, "stderr", "")

            # Combine output if both exist
            output = stdout if stdout else str(response)

            if exit_code != 0:
                logger.warning(f"Command exited with code {exit_code}")
                if stderr:
                    logger.warning(f"stderr: {stderr}")

            return {"output": output, "stderr": stderr, "exitCode": exit_code}
        except Exception as e:
            logger.error(
                f"Failed to execute command '{command}' in sandbox '{workspace_id}': {e}"
            )
            raise

    async def execute_python_code(
        self, workspace_id: str, code: str, file_path: str = "script.py"
    ) -> Dict[str, Any]:
        """
        Execute Python code securely using process.code_run()

        Args:
            workspace_id: Sandbox ID
            code: Python code to execute
            file_path: Optional file path to save code to

        Returns:
            Dict with output, stderr, and exitCode
        """
        try:
            sandbox = self._get_sandbox(workspace_id)
            if not sandbox:
                raise Exception(f"Sandbox {workspace_id} not found")

            logger.info(f"Executing Python code in sandbox {workspace_id}")

            # Try using code_run if available (more secure)
            if hasattr(sandbox.process, "code_run"):
                try:
                    response = await sandbox.process.code_run(
                        language="python", code=code
                    )

                    exit_code = getattr(response, "exit_code", 0)
                    stdout = getattr(response, "result", "")
                    stderr = getattr(response, "stderr", "")

                    logger.info(f"✅ Python code executed via code_run()")

                    return {"output": stdout, "stderr": stderr, "exitCode": exit_code}
                except Exception as e:
                    logger.warning(f"code_run() failed, falling back to exec(): {e}")

            # Fallback: Upload file and execute
            await self.upload_file(workspace_id, file_path, code)
            return await self.execute_command(workspace_id, f"python3 {file_path}")

        except Exception as e:
            logger.error(
                f"Failed to execute Python code in sandbox '{workspace_id}': {e}"
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

    async def create_snapshot(self, workspace_id: str, snapshot_name: str) -> Optional[str]:
        """
        Create a snapshot of a sandbox for faster future startups
        
        Args:
            workspace_id: Sandbox to snapshot
            snapshot_name: Name for the snapshot
            
        Returns:
            Snapshot ID if successful, None otherwise
        """
        try:
            sandbox = self._get_sandbox(workspace_id)
            if not sandbox:
                logger.error(f"Sandbox {workspace_id} not found for snapshot")
                return None
            
            logger.info(f"Creating snapshot '{snapshot_name}' from sandbox {workspace_id}")
            
            # Create snapshot if method exists
            if hasattr(sandbox, "create_snapshot"):
                snapshot = await sandbox.create_snapshot(name=snapshot_name)
                snapshot_id = getattr(snapshot, "id", snapshot_name)
                logger.info(f"✅ Created snapshot: {snapshot_id}")
                return snapshot_id
            else:
                logger.warning("create_snapshot() not available in this SDK version")
                return None
                
        except Exception as e:
            logger.error(f"Failed to create snapshot: {e}")
            return None

    async def close(self):
        """Close the Daytona client"""
        logger.info("Closing Daytona client")

    def _get_sandbox(self, workspace_id: str):
        """Get sandbox object by ID"""
        return self.active_sandboxes.get(workspace_id)
