import { Link } from "react-router-dom";
import ProfileIcon from "../components/ProfileIcon";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-yellow-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
              Rapid-go
            </p>
            <h1 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
              Ride dashboard
            </h1>
          </div>
          <ProfileIcon />
        </header>

        <main className="mt-10 grid flex-1 gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-gray-200 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-600">
              Welcome
            </p>
            <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
              Your profile is a click away.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
              Use the profile icon in the top-right corner to fetch your latest
              account details directly from the backend. It will show user or
              captain information depending on how you signed in.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">User route</p>
                <p className="mt-2 text-sm text-gray-600">
                  Loads data from <code>/api/users/profile</code>.
                </p>
              </div>
              <div className="rounded-3xl bg-yellow-50 p-4">
                <p className="text-sm font-semibold text-gray-900">
                  Captain route
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Loads data from <code>/api/captains/profile</code>.
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-[2rem] bg-gray-900 p-6 text-white shadow-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
              Shortcut
            </p>
            <h3 className="mt-3 text-2xl font-bold">
              Need to switch accounts?
            </h3>
            <p className="mt-4 text-sm leading-7 text-gray-300">
              Use the login and signup links to move between passenger and
              captain flows.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                to="/login"
                className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
              >
                User Login
              </Link>
              <Link
                to="/captain-login"
                className="rounded-2xl bg-yellow-400 px-4 py-3 text-center text-sm font-semibold text-gray-900 transition hover:bg-yellow-500"
              >
                Captain Login
              </Link>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default Home;
