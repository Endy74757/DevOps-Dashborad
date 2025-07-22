import subprocess
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
# New imports for GCP
import json
from google.oauth2 import service_account
from google.cloud import compute_v1
from google.api_core import exceptions as google_exceptions
import yaml
import tempfile

app = Flask(__name__)
# อนุญาตให้ frontend (เช่น localhost:5173) เรียก API นี้ได้
CORS(app) 

# --- ส่วนสำคัญด้านความปลอดภัย ---
# กำหนดรายการสคริปต์ที่อนุญาตให้รันได้เท่านั้น
# เราใช้ 'id' เป็น key เพื่อส่งมาจาก frontend
ALLOWED_SCRIPTS = {
    'list_files': './scripts/list_files.sh'
}

_basedir = os.path.abspath(os.path.dirname(__file__))
PROJECT_CONFIGS = {}
def load_project_configs():
    global PROJECT_CONFIGS
    try:
        # Use an absolute path to be safe, so it works regardless of CWD
        project_file_path = os.path.join(_basedir, 'projects.yaml')
        print(project_file_path)
        with open(project_file_path, 'r') as f:
            configs = yaml.safe_load(f)

            if not configs: # Handle empty yaml file
                print("Warning: projects.yaml is empty.")
                return
            for config in configs:
                # Resolve credentials_path to be absolute based on backend directory
                cred_path = config['credentials_path']
                if not os.path.isabs(cred_path):
                    config['credentials_path'] = os.path.join(_basedir, cred_path)
                PROJECT_CONFIGS[config['id']] = config
        print(PROJECT_CONFIGS)
    except Exception as e:
        print(f"Error loading project configurations: {e}")
        print(f"Please ensure that 'projects.yaml' exists and has the correct format.")
        PROJECT_CONFIGS = {}

def get_gcp_credentials(project_id):
    config = PROJECT_CONFIGS.get(project_id)
    if not config or 'credentials_path' not in config:
        raise ValueError(f"Credentials path for project '{project_id}' not found in projects.yaml")
    credentials_path = config['credentials_path']
    return service_account.Credentials.from_service_account_file(credentials_path, scopes=["https://www.googleapis.com/auth/cloud-platform"])

@app.route('/run-script', methods=['POST'])
def run_script():
    data = request.get_json()
    script_id = data.get('script_id')

    if not script_id or script_id not in ALLOWED_SCRIPTS:
        return jsonify({'error': 'Invalid or missing script_id'}), 400

    script_path = ALLOWED_SCRIPTS[script_id]

    # ตรวจสอบว่าไฟล์สคริปต์มีอยู่จริง
    if not os.path.exists(script_path):
        return jsonify({'error': f'Script not found: {script_path}'}), 500

    try:
        # รันสคริปต์และดักจับผลลัพธ์ (stdout) และ error (stderr)
        result = subprocess.run(
            # On Windows, we need to explicitly use 'bash' to run .sh files
            ['bash', script_path], capture_output=True, text=True, check=True, timeout=30
        )
        return jsonify({'output': result.stdout})
    except subprocess.CalledProcessError as e:
        # กรณีสคริปต์รันแล้วจบด้วย error code
        return jsonify({'error': 'Script failed', 'details': e.stderr}), 500
    except Exception as e:
        # ดักจับ error อื่นๆ เช่น timeout
        return jsonify({'error': 'An unexpected error occurred', 'details': str(e)}), 500

# --- NEW GCP Projects Endpoint ---

@app.route('/gcp/projects', methods=['GET'])
def get_gcp_projects():
    try:
        # Use an absolute path to be safe, so it works regardless of CWD
        project_file_path = os.path.join(_basedir, 'projects.yaml')
        with open(project_file_path, 'r') as f:
            projects = yaml.safe_load(f)
            return jsonify(projects or [])
    except FileNotFoundError:
        return jsonify({'error': 'projects.yaml not found on the server.'}), 404
    except yaml.YAMLError as e:
        return jsonify({'error': 'Error parsing projects.yaml', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'An unexpected error occurred', 'details': str(e)}), 500

# --- Refactored VM Listing Logic ---
def _list_vms_from_credentials(credentials, project_id, zone):
    """Helper function to list VMs given credentials."""
    instance_client = compute_v1.InstancesClient(credentials=credentials)
    instances = instance_client.list(project=project_id, zone=zone)
    
    vm_list = []
    for instance in instances:
        # Get external IP if available
        external_ip = ''
        if instance.network_interfaces and instance.network_interfaces[0].access_configs:
            external_ip = instance.network_interfaces[0].access_configs[0].nat_i_p

        vm_list.append({
            'name': instance.name,
            'status': instance.status,
            'machine_type': instance.machine_type.split('/')[-1],
            'internal_ip': instance.network_interfaces[0].network_i_p,
            'external_ip': external_ip or '-'
        })
    return vm_list

# --- NEW GCP Endpoints ---

@app.route('/gcp/vms', methods=['POST'])
def list_gcp_vms():
    data = request.get_json()
    project_id = data.get('project_id')
    zone = data.get('zone')

    if not project_id or not zone:
        return jsonify({'error': 'project_id and zone are required'}), 400

    try:
        credentials = get_gcp_credentials(project_id)
        vm_list = _list_vms_from_credentials(credentials, project_id, zone)
        return jsonify(vm_list)
        
    except google_exceptions.NotFound:
        return jsonify({'error': f'Project "{project_id}" or zone "{zone}" not found.'}), 404
    except google_exceptions.PermissionDenied:
        return jsonify({'error': 'Permission denied. Check the Service Account credentials and ensure it has the "Compute Viewer" role.'}), 403
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'An unexpected error occurred', 'details': str(e)}), 500

@app.route('/gcp/vms/upload', methods=['POST'])
def list_gcp_vms_from_upload():
    # Check if the post request has the file part
    if 'service_account_file' not in request.files:
        return jsonify({'error': 'No service_account_file part in the request'}), 400
    
    file = request.files['service_account_file']
    project_id = request.form.get('project_id')
    zone = request.form.get('zone')

    if not file or file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if not project_id or not zone:
        return jsonify({'error': 'project_id and zone are required'}), 400
    if not file.filename.endswith('.json'):
        return jsonify({'error': 'File must be a .json file'}), 400

    # Use a temporary file to securely handle the uploaded credentials
    temp_file_path = None
    try:
        # Create a temporary file and write the uploaded content to it
        with tempfile.NamedTemporaryFile(delete=False, suffix=".json", mode='w', encoding='utf-8') as temp_f:
            file.save(temp_f)
            temp_file_path = temp_f.name
        
        # Now use this temporary file to get credentials
        credentials_info = json.load(open(temp_file_path, 'r', encoding='utf-8'))
        credentials = service_account.Credentials.from_service_account_info(
            credentials_info,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )

        vm_list = _list_vms_from_credentials(credentials, project_id, zone)
        return jsonify(vm_list)

    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid JSON file format.'}), 400
    except google_exceptions.NotFound:
        return jsonify({'error': f'Project "{project_id}" or zone "{zone}" not found.'}), 404
    except google_exceptions.PermissionDenied:
        return jsonify({'error': 'Permission denied. Check the Service Account credentials and ensure it has the "Compute Viewer" role.'}), 403
    except Exception as e:
        return jsonify({'error': 'An unexpected error occurred', 'details': str(e)}), 500
    finally:
        # Ensure the temporary file is deleted
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.route('/gcp/load-balancers', methods=['POST'])
def list_load_balancers():
    data = request.get_json()
    project_id = data.get('project_id')
    region = data.get('region')

    if not project_id or not region:
        return jsonify({'error': 'project_id and region are required'}), 400

    try:
        credentials = get_gcp_credentials(project_id)
        client = compute_v1.ForwardingRulesClient(credentials=credentials)
        forwarding_rules = client.list(project=project_id, region=region)
        
        lb_list = []
        for rule in forwarding_rules:
            lb_list.append({
                'name': rule.name,
                'ip_address': rule.i_p_address,
                'target': rule.target.split('/')[-1],
                'load_balancing_scheme': rule.load_balancing_scheme,
                'ip_protocol': rule.i_p_protocol,
                'ports': list(rule.ports)
            })
            
        return jsonify(lb_list)

    except google_exceptions.NotFound:
        return jsonify({'error': f'Project "{project_id}" or region "{region}" not found.'}), 404
    except google_exceptions.PermissionDenied:
        return jsonify({'error': 'Permission denied. Check the Service Account credentials and ensure it has the "Compute Viewer" role.'}), 403
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'An unexpected error occurred', 'details': str(e)}), 500

if __name__ == '__main__':
    # --- Check for GOOGLE_APPLICATION_CREDENTIALS ---
    gac = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    print(f"GOOGLE_APPLICATION_CREDENTIALS is set to: {gac if gac else 'Not Set'}")
    # ------------------------------------------------
    load_project_configs() # โหลดคอนฟิกโปรเจกต์ตอนเริ่ม
    app.run(debug=True, port=5000)
