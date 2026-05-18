import { useContext, useState } from "react";
import ProfileIcon from "../components/ProfileIcon";
import UserDataContext from "../context/UserDataContext";

const Home = () => {
  const { userData } = useContext(UserDataContext) || {};
  const [formData, setFormData] = useState({
    source: "",
    destination: "",
  });
  const [tripRequest, setTripRequest] = useState(null);

  const handleChange = (event) => {
    const { id, value } = event.target;
    setFormData((current) => ({
      ...current,
      [id]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setTripRequest({
      source: formData.source.trim(),
      destination: formData.destination.trim(),
      requestedAt: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7d6,_#ffffff_45%,_#eef2ff_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-yellow-600">
              Rapid-go
            </p>
            <h1 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
              Book your next ride
            </h1>
          </div>
          <ProfileIcon />
        </header>

        <main className="mt-8 grid flex-1 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-2xl shadow-yellow-100/50 backdrop-blur sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-600">
                  Trip request
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  {userData?.name ? `Hi, ${userData.name}` : "Plan a pickup"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Enter your source and destination, then submit your ride
                  request. The map preview updates around your trip details.
                </p>
              </div>
              <div className="rounded-2xl bg-yellow-100 px-4 py-3 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-700">
                  Live
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  Map ready
                </p>
              </div>
            </div>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="source"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Source
                </label>
                <input
                  id="source"
                  type="text"
                  value={formData.source}
                  onChange={handleChange}
                  placeholder="Enter pickup location"
                  className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div>
                <label
                  htmlFor="destination"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Destination
                </label>
                <input
                  id="destination"
                  type="text"
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder="Enter drop location"
                  className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-black px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                Submit ride request
              </button>
            </form>

            {tripRequest && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                  Request submitted
                </p>
                <div className="mt-3 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
                  <div>
                    <span className="block text-xs uppercase tracking-[0.2em] text-gray-500">
                      Source
                    </span>
                    <p className="mt-1 font-medium">{tripRequest.source || "-"}</p>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.2em] text-gray-500">
                      Destination
                    </span>
                    <p className="mt-1 font-medium">
                      {tripRequest.destination || "-"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="block text-xs uppercase tracking-[0.2em] text-gray-500">
                      Submitted at
                    </span>
                    <p className="mt-1 font-medium">{tripRequest.requestedAt}</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-[#0f172a] p-4 shadow-2xl shadow-slate-300/40 sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(250,204,21,0.18),transparent_25%),radial-gradient(circle_at_80%_25%,rgba(96,165,250,0.18),transparent_22%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))]" />
            <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

            <div className="relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/40">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-300">
                    Map preview
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">
                    Route between pickup and drop
                  </h3>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                  Uber-style view
                </div>
              </div>

              <div className="relative flex-1">
                <div className="absolute inset-0">
                  <div className="absolute left-[12%] top-[18%] h-[70%] w-[2px] rotate-[-16deg] rounded-full bg-white/20" />
                  <div className="absolute left-[20%] top-[24%] h-[2px] w-[68%] rotate-[-10deg] rounded-full bg-yellow-400/55" />
                  <div className="absolute left-[15%] top-[64%] h-[2px] w-[60%] rotate-[8deg] rounded-full bg-sky-400/50" />
                  <div className="absolute left-[62%] top-[16%] h-[36%] w-[2px] rotate-[18deg] rounded-full bg-white/15" />
                </div>

                <div className="absolute left-[18%] top-[26%] flex flex-col items-center">
                  <div className="h-4 w-4 rounded-full border-4 border-white bg-yellow-400 shadow-[0_0_0_10px_rgba(250,204,21,0.18)]" />
                  <span className="mt-3 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                    Pickup
                  </span>
                </div>

                <div className="absolute right-[16%] bottom-[24%] flex flex-col items-center">
                  <div className="h-4 w-4 rounded-full border-4 border-white bg-sky-400 shadow-[0_0_0_10px_rgba(96,165,250,0.18)]" />
                  <span className="mt-3 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                    Drop
                  </span>
                </div>

                <div className="absolute left-[22%] top-[30%] h-[44%] w-[52%] rounded-full border-2 border-dashed border-yellow-300/70" />
                <div className="absolute left-[22%] top-[30%] h-[44%] w-[52%] rounded-full border border-yellow-200/20 blur-[0.5px]" />

                <div className="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-white shadow-xl backdrop-blur">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                        Trip status
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {tripRequest
                          ? "Request captured and waiting for matching."
                          : "Enter details to preview the route."}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        Stops
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        Source to destination
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        Source
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {formData.source || "Add pickup location"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        Destination
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {formData.destination || "Add drop location"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Home;
