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

  const [projectId, setProjectId] = useState('');
  const [zone, setZone] = useState('');
  const [region, setRegion] = useState('');
  const [activeGcpTab, setActiveGcpTab] = useState('');

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');

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

  const handleFetchLBs = () => {
    setActiveGcpTab('loadBalancers');
    if (!projectId || !region) {
      setGcpError('Project ID and Region are required.');
      return;
    }
    gcpApiRequest('/api/gcp/load-balancers', { project_id: projectId, region });
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

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
    setUploadStatus('');
    setUploadError('');
  };

  const handleUploadCredential = async () => {
    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }
    if (!selectedProjectId) {
      setUploadError('Please select a project.');
      return;
    }
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('project_id', selectedProjectId);
    setUploadStatus('');
    setUploadError('');
    try {
      const response = await axios.post('/api/gcp/upload-credential', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadStatus('Upload successful!');
      setUploadError('');
      setUploadFile(null);
    } catch (err) {
      const errorDetails = err.response?.data?.error || err.message;
      setUploadError(`Upload failed: ${errorDetails}`);
      setUploadStatus('');
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

    if (activeGcpTab === 'loadBalancers') {
      return (
        <table className="gcp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>IP Address</th>
              <th>Target</th>
              <th>Scheme</th>
              <th>Protocol / Ports</th>
            </tr>
          </thead>
          <tbody>
            {gcpOutput.map((lb) => (
              <tr key={lb.name}>
                <td>{lb.name}</td>
                <td>{lb.ip_address}</td>
                <td>{lb.target}</td>
                <td>{lb.load_balancing_scheme}</td>
                <td>{`${lb.ip_protocol}: ${lb.ports.join(', ')}`}</td>
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
        {/* Credential Upload Section */}
        <div className="gcp-credential-upload" style={{ margin: '10px 0' }}>
          <label>
            Upload Service Account Credential (.json):
            <input type="file" accept=".json" onChange={handleFileChange} />
          </label>
          <button onClick={handleUploadCredential} disabled={!uploadFile || !selectedProjectId} style={{ marginLeft: '8px' }}>
            Upload
          </button>
          {uploadStatus && <span style={{ color: 'green', marginLeft: '10px' }}>{uploadStatus}</span>}
          {uploadError && <span style={{ color: 'red', marginLeft: '10px' }}>{uploadError}</span>}
        </div>
        <div className="gcp-actions">
          <button onClick={handleFetchVMs} disabled={isGcpLoading}>
            {isGcpLoading && activeGcpTab === 'vms' ? 'Fetching...' : 'List VMs'}
          </button>
          <button onClick={handleFetchLBs} disabled={isGcpLoading}>
            {isGcpLoading && activeGcpTab === 'loadBalancers' ? 'Fetching...' : 'List Load Balancers'}
          </button>
        </div>
        <div className="output-area">
          <h3>GCP Output:</h3>
          {gcpError && <pre className="error-output">{gcpError}</pre>}
          {renderGcpOutput()}
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
