
const UserLogin = () => {
  return (
    <div className="p-7">
        <form>
      <h3 className="text-xl mb-2">What is your email?</h3>
        <input type="email" placeholder="Enter your email" required  className="bg-white rounded px-4 py-2 border w-full"/>
        <h3 className="text-xl mb-2">Enter password?</h3>
        <input type="password" placeholder="Enter your password" required  className="bg-white rounded px-4 py-2 border w-full"/>
        <button type="submit" className="bg-black text-white font-bold py-2 px-4 rounded w-full mt-5">
          Login
        </button>
      </form>
    </div>
  )
}

export default UserLogin