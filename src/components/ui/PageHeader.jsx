export default function PageHeader({ title, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">

      <h1 className="text-2xl font-semibold">
        {title}
      </h1>

      {children}

    </div>
  );
}