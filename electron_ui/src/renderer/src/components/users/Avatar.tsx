export const Avatar = ({ src }: { src?: string }): React.JSX.Element => {
  if (src) {
    return <img src={src} className="object-contain size-full rounded-full" alt="Profile" />
  }
  return (
    <div className="relative size-full rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
      {/* add a tiny inset so nothing gets clipped */}
      <div className="size-full p-[10%]">
        <svg
          className="size-full text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
          />
        </svg>
      </div>
    </div>
  )
}
