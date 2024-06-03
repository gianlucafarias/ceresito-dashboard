import { useState } from 'react';
import { useRouter } from 'next/router';

export default function ProjectDetails({ project }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Colaborador');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { id } = router.query;

  const handleInvite = async (e: any) => {
    e.preventDefault();

    const response = await fetch(`/api/projects/${id}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId: id, userEmail: email, role }),
    });

    if (response.ok) {
      setSuccess('User invited successfully');
      setError('');
    } else {
      setError('Failed to invite user');
      setSuccess('');
    }
  };

  return (
    <div>
      <h1>{project.name}</h1>
      <p>{project.description}</p>

      <h2>Invite User</h2>
      <form onSubmit={handleInvite}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="User email"
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="Administrador">Administrador</option>
          <option value="Colaborador">Colaborador</option>
          <option value="Observador">Observador</option>
        </select>
        <button type="submit">Invite</button>
      </form>
      {error && <p>{error}</p>}
      {success && <p>{success}</p>}
    </div>
  );
}
