const FormatDate = ({ date }) => {
  return (
    <span>
      {new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}
    </span>
  );
};

export default FormatDate;