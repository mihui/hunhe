'use client';

export const Providers = ({ children }) => {
  return (
    <div className="wrapper">
      <header>Header</header>
      {children}
      <footer>Footer</footer>
    </div>
  );
}
