#!/usr/bin/env python3
"""
Wrapper script to run olmOCR on CPU by patching GPU checks
"""
import sys
import os
import subprocess
from pathlib import Path

def patch_olmocr_gpu_check():
    """Patch olmOCR to skip GPU checks"""
    try:
        import olmocr
        olmocr_path = Path(olmocr.__file__).parent
        
        # Find the check.py file
        check_file = olmocr_path / "check.py"
        if check_file.exists():
            # Read the original file
            with open(check_file, 'r') as f:
                content = f.read()
            
            # Create a backup
            backup_file = check_file.with_suffix('.py.backup')
            if not backup_file.exists():
                with open(backup_file, 'w') as f:
                    f.write(content)
            
            # Patch the GPU check function
            if 'def check_torch_gpu_available():' in content:
                # Replace the function to always return True (skip GPU check)
                patched_content = content.replace(
                    'def check_torch_gpu_available():',
                    'def check_torch_gpu_available():\n    return True  # Patched to skip GPU check'
                )
                
                # Also patch the actual GPU check logic
                patched_content = patched_content.replace(
                    'gpu_memory = torch.cuda.get_device_properties(0).total_memory',
                    '# gpu_memory = torch.cuda.get_device_properties(0).total_memory  # Skipped for CPU mode'
                )
                
                # Write the patched file
                with open(check_file, 'w') as f:
                    f.write(patched_content)
                
                print("Successfully patched olmOCR GPU check")
                return True
    except Exception as e:
        print(f"Failed to patch olmOCR: {e}")
        return False

def main():
    """Main function to run olmOCR with CPU patch"""
    # Patch the GPU check
    if not patch_olmocr_gpu_check():
        print("Warning: Could not patch olmOCR GPU check")
    
    # Set environment variables for CPU mode
    env = os.environ.copy()
    env['CUDA_VISIBLE_DEVICES'] = ''
    env['TORCH_DEVICE'] = 'cpu'
    env['PYTHONUNBUFFERED'] = '1'
    env['PYTHONIOENCODING'] = 'utf-8'
    
    # Run the original olmocr command
    cmd = ['python', '-m', 'olmocr.pipeline'] + sys.argv[1:]
    print(f"Running: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, env=env, check=True)
        return result.returncode
    except subprocess.CalledProcessError as e:
        print(f"olmOCR failed with return code: {e.returncode}")
        return e.returncode
    except Exception as e:
        print(f"Error running olmOCR: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 