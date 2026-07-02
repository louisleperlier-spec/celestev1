import "./SkyBackground.css";

export default function SkyBackground() {
  return (
    <div className="sky" aria-hidden="true">
      <div className="sky__cloud sky__cloud--1" />
      <div className="sky__cloud sky__cloud--2" />
      <div className="sky__cloud sky__cloud--3" />
      <div className="sky__cloud sky__cloud--4" />
      <div className="sky__star sky__star--1">✦</div>
      <div className="sky__star sky__star--2">✦</div>
      <div className="sky__star sky__star--3">✦</div>
    </div>
  );
}
