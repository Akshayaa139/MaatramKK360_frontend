const {
  timeRangesOverlap,
  pickBestTutorSlotForStudents,
} = require("../controllers/adminController");

describe("adminController helpers", () => {
  test("timeRangesOverlap same day overlapping", () => {
    const a = { day: "Monday", startTime: "10:00", endTime: "11:00" };
    const b = { day: "Monday", startTime: "10:30", endTime: "11:30" };
    expect(timeRangesOverlap(a, b)).toBe(true);
  });

  test("timeRangesOverlap different day", () => {
    const a = { day: "Monday", startTime: "10:00", endTime: "11:00" };
    const b = { day: "Tuesday", startTime: "10:30", endTime: "11:30" };
    expect(timeRangesOverlap(a, b)).toBe(false);
  });

  test("pickBestTutorSlotForStudents picks slot with most matches", () => {
    const tutor = {
      availability: [
        { day: "Monday", startTime: "10:00", endTime: "11:00" },
        { day: "Tuesday", startTime: "15:00", endTime: "16:00" },
      ],
    };
    const students = [
      {
        availability: [{ day: "Monday", startTime: "10:00", endTime: "11:00" }],
      },
      {
        availability: [{ day: "Monday", startTime: "10:00", endTime: "11:00" }],
      },
      {
        availability: [
          { day: "Tuesday", startTime: "15:00", endTime: "16:00" },
        ],
      },
    ];
    const best = pickBestTutorSlotForStudents(tutor, students);
    expect(best).toBeTruthy();
    expect(best.count).toBe(2);
    expect(best.slot.day).toBe("Monday");
  });
});
