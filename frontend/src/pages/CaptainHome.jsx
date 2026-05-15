import { Link } from "react-router-dom";
import ProfileIcon from "../components/ProfileIcon";

const CaptainHome = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-gray-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-yellow-600">
              Rapid-go Captain
            </p>
            <h1 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
              Captain dashboard
            </h1>
          </div>
          <ProfileIcon />
        </header>

        <main className="mt-10 grid flex-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-[2rem] bg-gray-900 p-6 text-white shadow-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
              Today
            </p>
            <h2 className="mt-3 text-2xl font-bold">
              Ready to accept rides?
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-300">
              Your profile page holds your live account details. Use the
              dashboard cards below to keep an eye on ride readiness, profile
              status, and account actions.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  Status
                </p>
                <p className="mt-2 text-lg font-semibold">Online ready</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  Profile
                </p>
                <p className="mt-2 text-lg font-semibold">Synced</p>
              </div>
            </div>
          </aside>

          <section className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-gray-200 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-600">
              Captain tools
            </p>
            <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
              Everything you need in one place.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
              This is your captain-specific home screen. Use it to jump to your
              profile, review account details, and move between captain login
              flows if needed.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Link
                to="/profile"
                className="rounded-3xl bg-yellow-50 p-4 transition hover:bg-yellow-100"
              >
                <p className="text-sm font-semibold text-gray-900">
                  Open profile
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  View your live captain account details.
                </p>
              </Link>
              <Link
                to="/captain-login"
                className="rounded-3xl bg-gray-50 p-4 transition hover:bg-gray-100"
              >
                <p className="text-sm font-semibold text-gray-900">
                  Switch account
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Go back to the captain login screen.
                </p>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default CaptainHome;
