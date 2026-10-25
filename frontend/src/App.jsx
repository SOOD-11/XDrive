import { useEffect, useState } from 'react';
import { api } from './api';

const emptyFilters = {
  maker: '',
  name: '',
  category: '',
  minPrice: '',
  maxPrice: '',
};

const emptyVehicle = {
  name: '',
  maker: '',
  color: '',
  category: 'sedan',
  price: '',
  quantityAvailable: 0,
};

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem('xdrive-session'));
  } catch {
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState(readSession);
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [stockAmounts, setStockAmounts] = useState({});
  const [form, setForm] = useState(emptyVehicle);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const token = session?.token;
  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    if (!token) return;

    api('/api/vehicles', { token })
      .then((data) => setVehicles(data.vehicles))
      .catch((err) => setError(err.message));
  }, [token]);

  async function loadVehicles(selectedFilters = filters) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(selectedFilters)) {
      if (String(value).trim()) params.set(key, String(value).trim());
    }

    const path = params.toString()
      ? `/api/vehicles/search?${params}`
      : '/api/vehicles';

    const data = await api(path, { token });
    setVehicles(data.vehicles);
  }

  async function handleAuth(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      if (authMode === 'register') {
        await api('/api/auth/register', {
          method: 'POST',
          body: { username, password },
        });
      }

      const result = await api('/api/auth/login', {
        method: 'POST',
        body: { username, password },
      });

      const nextSession = { token: result.token, user: result.user };
      sessionStorage.setItem('xdrive-session', JSON.stringify(nextSession));
      setSession(nextSession);
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    setError('');

    try {
      await loadVehicles(filters);
    } catch (err) {
      setError(err.message);
    }
  }

  async function runAction(action, successMessage) {
    setBusy(true);
    setError('');
    setNotice('');

    try {
      await action();
      await loadVehicles();
      setNotice(successMessage);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveVehicle(event) {
    event.preventDefault();

    const details = {
      name: form.name,
      maker: form.maker,
      color: form.color,
      category: form.category,
      price: form.price,
    };

    const saved = await runAction(
      () => editingId
        ? api(`/api/vehicles/${editingId}`, {
            method: 'PUT',
            token,
            body: details,
          })
        : api('/api/vehicles', {
            method: 'POST',
            token,
            body: {
              ...details,
              quantityAvailable: Number(form.quantityAvailable),
            },
          }),
      editingId ? 'Vehicle updated.' : 'Vehicle added.',
    );

    if (saved) {
      setShowForm(false);
      setEditingId(null);
      setForm(emptyVehicle);
    }
  }

  function startEditing(vehicle) {
    setEditingId(vehicle.id);
    setForm({
      name: vehicle.name,
      maker: vehicle.maker,
      color: vehicle.color,
      category: vehicle.category,
      price: vehicle.price,
      quantityAvailable: vehicle.quantityAvailable,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function logout() {
    sessionStorage.removeItem('xdrive-session');
    setSession(null);
    setVehicles([]);
    setError('');
    setNotice('');
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-600">
            XDrive
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            {authMode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-2 text-slate-500">
            Find the right car and see its live availability.
          </p>

          <form onSubmit={handleAuth} className="mt-8 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Username
              <input
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-blue-500"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-blue-500"
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              disabled={busy}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? 'Please wait...' : authMode === 'login' ? 'Log in' : 'Register'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setError('');
              setAuthMode(authMode === 'login' ? 'register' : 'login');
            }}
            className="mt-5 text-sm font-medium text-blue-600"
          >
            {authMode === 'login'
              ? 'New here? Create an account'
              : 'Already have an account? Log in'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div>
            <p className="text-xl font-black tracking-wide">XDrive</p>
            <p className="text-xs text-slate-400">Car dealership inventory</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-300 sm:block">
              {session.user.username} · {session.user.role}
            </span>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-5 pb-12 pt-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            Browse the collection
          </p>
          <h1 className="mt-3 max-w-xl text-4xl font-bold sm:text-5xl">
            Your next drive starts here.
          </h1>
          <p className="mt-4 text-slate-300">
            Explore vehicles, compare prices, and check what’s in stock.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        {error && (
          <div className="mb-5 rounded-xl bg-red-50 px-5 py-3 text-red-700">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-5 rounded-xl bg-green-50 px-5 py-3 text-green-700">
            {notice}
          </div>
        )}

        {isAdmin && (
          <section className="mb-8">
            <button
              onClick={() => {
                setEditingId(null);
                setForm(emptyVehicle);
                setShowForm(!showForm);
              }}
              className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
            >
              {showForm ? 'Close form' : '+ Add vehicle'}
            </button>

            {showForm && (
              <form
                onSubmit={saveVehicle}
                className="mt-4 grid gap-4 rounded-2xl bg-white p-6 shadow-sm sm:grid-cols-2"
              >
                <h2 className="sm:col-span-2 text-xl font-bold">
                  {editingId ? 'Edit vehicle' : 'Add vehicle'}
                </h2>

                {['name', 'maker', 'color'].map((field) => (
                  <label key={field} className="text-sm font-medium capitalize">
                    {field}
                    <input
                      required
                      value={form[field]}
                      onChange={(event) =>
                        setForm({ ...form, [field]: event.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-slate-300 p-3"
                    />
                  </label>
                ))}

                <label className="text-sm font-medium">
                  Category
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-3"
                  >
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="muv">MUV</option>
                  </select>
                </label>

                <label className="text-sm font-medium">
                  Price
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      setForm({ ...form, price: event.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-3"
                  />
                </label>

                {!editingId && (
                  <label className="text-sm font-medium">
                    Starting stock
                    <input
                      required
                      type="number"
                      min="0"
                      value={form.quantityAvailable}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          quantityAvailable: event.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-lg border border-slate-300 p-3"
                    />
                  </label>
                )}

                <div className="flex gap-3 sm:col-span-2">
                  <button
                    disabled={busy}
                    className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    Save vehicle
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg border border-slate-300 px-5 py-3"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        <form
          onSubmit={handleSearch}
          className="grid gap-3 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-6"
        >
          <input
            placeholder="Maker"
            value={filters.maker}
            onChange={(event) =>
              setFilters({ ...filters, maker: event.target.value })
            }
            className="rounded-lg border border-slate-300 p-3"
          />
          <input
            placeholder="Name / model"
            value={filters.name}
            onChange={(event) =>
              setFilters({ ...filters, name: event.target.value })
            }
            className="rounded-lg border border-slate-300 p-3"
          />
          <select
            value={filters.category}
            onChange={(event) =>
              setFilters({ ...filters, category: event.target.value })
            }
            className="rounded-lg border border-slate-300 p-3"
          >
            <option value="">All categories</option>
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="muv">MUV</option>
          </select>
          <input
            type="number"
            min="0"
            placeholder="Min price"
            value={filters.minPrice}
            onChange={(event) =>
              setFilters({ ...filters, minPrice: event.target.value })
            }
            className="rounded-lg border border-slate-300 p-3"
          />
          <input
            type="number"
            min="0"
            placeholder="Max price"
            value={filters.maxPrice}
            onChange={(event) =>
              setFilters({ ...filters, maxPrice: event.target.value })
            }
            className="rounded-lg border border-slate-300 p-3"
          />
          <button className="rounded-lg bg-blue-600 p-3 font-semibold text-white">
            Search
          </button>
        </form>

        <div className="mb-5 mt-9 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Available vehicles</h2>
          <span className="text-sm text-slate-500">
            {vehicles.length} results
          </span>
        </div>

        {vehicles.length === 0 && (
          <p className="rounded-xl bg-white p-8 text-slate-500">
            No vehicles match your search.
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => (
            <article
              key={vehicle.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              {vehicle.vehicleUrl ? (
                <img
                  src={vehicle.vehicleUrl}
                  alt={vehicle.name}
                  className="h-52 w-full object-cover"
                />
              ) : (
                <div className="flex h-52 items-center justify-center bg-gradient-to-br from-slate-800 to-blue-700 text-7xl">
                  🚘
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-600">
                      {vehicle.maker}
                    </p>
                    <h3 className="mt-1 text-xl font-bold">{vehicle.name}</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase">
                    {vehicle.category}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  {vehicle.color} ·{' '}
                  {vehicle.quantityAvailable > 0
                    ? `${vehicle.quantityAvailable} in stock`
                    : 'Out of stock'}
                </p>
                <p className="mt-4 text-2xl font-bold">
                  {Number(vehicle.price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>

                {!isAdmin ? (
                  <button
                    disabled={busy || vehicle.quantityAvailable === 0}
                    onClick={() =>
                      runAction(
                        () => api(`/api/vehicles/${vehicle.id}/purchase`, {
                          method: 'POST',
                          token,
                          body: { quantity: 1 },
                        }),
                        'Purchase successful.',
                      )
                    }
                    className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white disabled:bg-slate-300"
                  >
                    {vehicle.quantityAvailable === 0 ? 'Sold out' : 'Purchase'}
                  </button>
                ) : (
                  <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(vehicle)}
                        className="rounded-lg border border-slate-300 px-4 py-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${vehicle.name}?`)) {
                            runAction(
                              () => api(`/api/vehicles/${vehicle.id}`, {
                                method: 'DELETE',
                                token,
                              }),
                              'Vehicle deleted.',
                            );
                          }
                        }}
                        className="rounded-lg border border-red-200 px-4 py-2 text-red-600"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        aria-label={`Restock amount for ${vehicle.name}`}
                        type="number"
                        min="1"
                        value={stockAmounts[vehicle.id] ?? 1}
                        onChange={(event) =>
                          setStockAmounts({
                            ...stockAmounts,
                            [vehicle.id]: event.target.value,
                          })
                        }
                        className="w-20 rounded-lg border border-slate-300 px-3"
                      />
                      <button
                        disabled={busy}
                        onClick={() =>
                          runAction(
                            () => api(`/api/vehicles/${vehicle.id}/restock`, {
                              method: 'POST',
                              token,
                              body: {
                                quantity: Number(stockAmounts[vehicle.id] ?? 1),
                              },
                            }),
                            'Stock updated.',
                          )
                        }
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
                      >
                        Restock
                      </button>
                    </div>

                    <label className="block text-sm text-slate-600">
                      Upload photo
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="mt-2 block w-full text-sm"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;

                          const body = new FormData();
                          body.append('image', file);

                          runAction(
                            () => api(`/api/vehicles/${vehicle.id}/image`, {
                              method: 'POST',
                              token,
                              body,
                            }),
                            'Photo uploaded.',
                          );

                          event.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}