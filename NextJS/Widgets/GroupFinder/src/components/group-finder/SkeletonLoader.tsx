"use client";

export default function SkeletonLoader({ count = 5 }: { count?: number }) {
  return (
    <div className="groups">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="groupGrid skel-card" data-skel="">
          <h3 className="groupTitle">
            <span className="skel h-24 w-60"></span>
          </h3>
          <div className="groupDetailsContainer">
            <h6>RHYTHM</h6>
            <div className="groupDetails">
              <span className="skel h-16 w-120"></span>
              <span className="skel h-16 w-120"></span>
              <span className="skel h-16 w-60"></span>
              <span className="skel h-16 w-120"></span>
              <span className="skel h-16 w-70"></span>
              <span className="skel h-16 w-80"></span>
            </div>
          </div>
          <div className="groupLeadersContainer">
            <h6>LEADERS</h6>
            <div>
              <span className="skel h-16 w-60"></span>
            </div>
          </div>
          <div className="groupAboutContainer">
            <h6>ABOUT US</h6>
            <div>
              <div className="skel h-16 w-80"></div>
              <div className="skel h-16 w-70" style={{ marginTop: '0.4rem' }}></div>
              <div className="skel h-16 w-60" style={{ marginTop: '0.4rem' }}></div>
            </div>
          </div>
          <div className="groupTagsContainer">
            <ul className="groupTags">
              <li><span className="skel skel-pill w-120"></span></li>
              <li><span className="skel skel-pill w-120"></span></li>
              <li><span className="skel skel-pill w-120"></span></li>
            </ul>
          </div>
          <div className="groupSignUpBtn">
            <div className="skel h-44 w-120"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
