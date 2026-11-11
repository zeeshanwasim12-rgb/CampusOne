/** Standard page title block with optional description and right-side actions. */
export default function PageHeader({ title, description, icon: Icon, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon size={22} />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
