export default function DefinitionItem({
  term,
  description,
  tags,
}: {
  term: string
  description: string | string[]
  tags?: string[]
}) {
  return (
    <div className="w-full flex flex-col min-h-64">
      <div className="flex gap-16 items-center">
        <dt className="text-[14px] text-neutral-subtext font-medium">{term}</dt>
        {tags && (
          <div className="flex gap-8">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="text-[12px] py-4 px-8 bg-neutral-background rounded-[10px]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* description이 하나면 하나만 출력, 두개면 두개 출력 */}
      {Array.isArray(description) ? (
        description.map((d, i) => (
          <dd key={i} className="text-[14px] flex-1 min-h-0 overflow-auto">
            {d}
          </dd>
        ))
      ) : (
        <dd className="text-[14px] flex-1 min-h-0 overflow-auto">
          {description}
        </dd>
      )}
    </div>
  )
}
