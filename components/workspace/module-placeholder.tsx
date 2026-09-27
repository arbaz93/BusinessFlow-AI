type ModulePlaceholderProps = {
  title: string;
  description: string;
};

export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  return (
    <section className="mx-auto max-w-3xl py-10">
      <p className="text-sm font-medium text-[#a49bff]">BusinessFlow AI</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">{description}</p>
      <div className="mt-8 rounded-xl border border-dashed border-white/15 bg-white/[0.025] px-5 py-12 text-center text-sm text-white/45">
        This workspace area is ready for its next development slice.
      </div>
    </section>
  );
}