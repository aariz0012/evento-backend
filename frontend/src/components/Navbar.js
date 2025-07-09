import Link from 'next/link';

const Navbar = () => (
  <nav className="flex items-center justify-between px-6 py-4 bg-white shadow">
    <div className="text-2xl font-bold text-blue-700">
      <Link href="/">EventO</Link>
    </div>
    <div className="flex space-x-6">
      <Link href="/">Home</Link>
      <Link href="/venues">Venues</Link>
      <Link href="/services">Services</Link>
      <Link href="/about">About</Link>
      <Link href="/contact">Contact</Link>
      <Link href="/login">Log In</Link>
      <Link href="/register">
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Sign Up</button>
      </Link>
      <Link href="/host/register">
        <button className="bg-pink-500 text-white px-4 py-2 rounded">Become a Host</button>
      </Link>
    </div>
  </nav>
);

export default Navbar;
