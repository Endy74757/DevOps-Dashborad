import { useState, useEffect } from 'react';
import axios from 'axios'; // ใช้สำหรับเรียก API
import './App.css';

function App() {
  // States for Script Runner
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // New states for GCP
  const [gcpOutput, setGcpOutput] = useState(null);
  const [gcpError, setGcpError] = useState('');
  const [isGcpLoading, setIsGcpLoading] = useState(false);
  
  // States for multi-project support
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // States for ad-hoc project via upload
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProjectId, setUploadProjectId] = useState('');
  const [uploadZone, setUploadZone] = useState('');

  const [projectId, setProjectId] = useState('');
  const [zone, setZone] = useState('');
  const [region, setRegion] = useState('');
  const [activeGcpTab, setActiveGcpTab] = useState('');

  // Fetch projects on component load
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/api/gcp/projects');
        setProjects(response.data || []);
        if (response.data && response.data.length > 0) {
          // Select the first project by default
          handleProjectChange(response.data[0].id, response.data);
        }
      } catch (error) {
        setGcpError('Failed to load project list. Please check if the backend is running and if projects.yaml exists and is valid.');
      }
    };
    fetchProjects();
  }, []); // Empty array ensures this runs only once

  const handleProjectChange = (newProjectId, projectList) => {
    const aProjects = projectList || projects;
    const project = aProjects.find(p => p.id === newProjectId);
    if (project) {
      setSelectedProjectId(project.id);
      setProjectId(project.id);
      setZone(project.default_zone || '');
      setRegion(project.default_region || '');
      setGcpOutput(null);
      setGcpError('');
    }
  };

  const gcpApiRequest = async (endpoint, payload) => {
    setIsGcpLoading(true);
    setGcpOutput(null);
    setGcpError('');
    try {
      const response = await axios.post(endpoint, payload);
      setGcpOutput(response.data);
    } catch (err) {
      const errorDetails = err.response?.data?.error || err.message;
      const details = err.response?.data?.details || '';
      setGcpError(`Failed to fetch data: ${errorDetails} ${details}`);
    } finally {
      setIsGcpLoading(false);
    }
  };

  const handleFetchVMs = () => {
    setActiveGcpTab('vms');
    if (!projectId || !zone) {
      setGcpError('Project ID and Zone are required.');
      return;
    }
    gcpApiRequest('/api/gcp/vms', { project_id: projectId, zone });
  };

  const handleFetchVMsFromUpload = async () => {
    setActiveGcpTab('vms'); // Reuse the same output table
    if (!uploadFile || !uploadProjectId || !uploadZone) {
      setGcpError('Service Account file, Project ID, and Zone are required for upload.');
      return;
    }

    const formData = new FormData();
    formData.append('service_account_file', uploadFile);
    formData.append('project_id', uploadProjectId);
    formData.append('zone', uploadZone);

    setIsGcpLoading(true);
    setGcpOutput(null);
    setGcpError('');
    try {
      const response = await axios.post('/api/gcp/vms/upload', formData);
      setGcpOutput(response.data);
    } catch (err) {
      const errorDetails = err.response?.data?.error || err.message;
      const details = err.response?.data?.details || '';
      setGcpError(`Failed to fetch data from uploaded file: ${errorDetails} ${details}`);
    } finally {
      setIsGcpLoading(false);
    }
  };

  const handleRunScript = async () => {
    setIsLoading(true);
    setOutput('');
    setError('');

    try {
      // เรียก API ที่ backend ของเรา
      const response = await axios.post('/api/run-script', {
        script_id: 'list_files' // ส่ง id ของสคริปต์ที่ต้องการรัน
      });
      setOutput(response.data.output);
    } catch (err) {
      // จัดการ error ที่อาจเกิดขึ้น
      const errorDetails = err.response?.data?.details || err.message;
      setError(`Failed to run script: ${errorDetails}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderGcpOutput = () => {
    if (isGcpLoading) return <p>Loading...</p>;
    if (!gcpOutput) return null;

    if (gcpOutput.length === 0) {
      return <p>No resources found for this query.</p>;
    }

    if (activeGcpTab === 'vms') {
      return (
        <table className="gcp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Machine Type</th>
              <th>Internal IP</th>
              <th>External IP</th>
            </tr>
          </thead>
          <tbody>
            {gcpOutput.map((vm) => (
              <tr key={vm.name}>
                <td>{vm.name}</td>
                <td>{vm.status}</td>
                <td>{vm.machine_type}</td>
                <td>{vm.internal_ip}</td>
                <td>{vm.external_ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return null;
  };

  return (
    <div className="app-container">
      <h1>DevOps Helper Dashboard</h1>

      {/* --- GCP Section --- */}
      <div className="gcp-section">
        <h2>Google Cloud Platform</h2>
        <div className="gcp-inputs">
          <select value={selectedProjectId} onChange={(e) => handleProjectChange(e.target.value)}>
            <option value="" disabled>-- Select a Project --</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
            ))}
          </select>
          <input type="text" value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Zone (e.g., asia-southeast1-b)" />
          <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Region (e.g., asia-southeast1)" />
        </div>
        <div className="gcp-actions">
          <button onClick={handleFetchVMs} disabled={isGcpLoading}>
            {isGcpLoading && activeGcpTab === 'vms' ? 'Fetching...' : 'List VMs'}
          </button>
        </div>
        <div className="output-area">
          <h3>GCP Output:</h3>
          {gcpError && <pre className="error-output">{gcpError}</pre>}
          {renderGcpOutput()}
        </div>
      </div>

      {/* --- Ad-hoc Project Upload Section --- */}
      <div className="upload-section">
        <h2>Ad-hoc Project (Upload)</h2>
        <div className="gcp-inputs">
          <input type="file" accept=".json" onChange={(e) => setUploadFile(e.target.files[0])} />
          <input type="text" value={uploadProjectId} onChange={(e) => setUploadProjectId(e.target.value)} placeholder="Project ID (e.g., my-gcp-project)" />
          <input type="text" value={uploadZone} onChange={(e) => setUploadZone(e.target.value)} placeholder="Zone (e.g., asia-southeast1-b)" />
        </div>
        <div className="gcp-actions">
          <button onClick={handleFetchVMsFromUpload} disabled={isGcpLoading}>
            {isGcpLoading ? 'Fetching...' : 'List VMs from Uploaded File'}
          </button>
        </div>
      </div>

      {/* --- Script Runner Section --- */}
      <div className="script-runner-section">
        <h2>Script Runner</h2>
        <div className="card">
          <button onClick={handleRunScript} disabled={isLoading}>
            {isLoading ? 'Running...' : 'Run "List Files" Script'}
          </button>
        </div>
        <div className="output-area">
          <h3>Script Output:</h3>
          {error && <pre className="error-output">{error}</pre>}
          {output && <pre className="success-output">{output}</pre>}
        </div>
      </div>
    </div>
  )
}

export default App
