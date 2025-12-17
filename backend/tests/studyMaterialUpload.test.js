const request = require("supertest");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const app = require("../server");
const User = require("../models/User");
const Tutor = require("../models/Tutor");
const StudyMaterial = require("../models/StudyMaterial");

describe("Study material upload", () => {
  let user;
  let tutor;
  let token;

  beforeAll(async () => {
    // ensure DB connected (wait up to 10s)
    const start = Date.now();
    while (mongoose.connection.readyState !== 1 && Date.now() - start < 10000) {
      await new Promise((res) => setTimeout(res, 200));
    }
    if (mongoose.connection.readyState !== 1)
      throw new Error("DB not connected for tests");
    user = await User.create({
      name: "Upload Test",
      email: `upload-${Date.now()}@example.com`,
      password: "Test1234",
      role: "tutor",
    });
    tutor = await Tutor.create({
      user: user._id,
      qualifications: "B.Ed",
      subjects: ["Math"],
      availability: [{ day: "Monday", startTime: "10:00", endTime: "11:00" }],
    });
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "devsecret", {
      expiresIn: "1h",
    });
  });

  afterAll(async () => {
    // cleanup created records
    if (tutor && tutor._id)
      await StudyMaterial.deleteMany({ tutor: tutor._id });
    if (tutor && tutor._id) await Tutor.deleteOne({ _id: tutor._id });
    if (user && user._id) await User.deleteOne({ _id: user._id });
    // close mongoose connection so Jest can exit cleanly
    try {
      await mongoose.connection.close();
    } catch (e) {
      /* ignore */
    }
  });

  test("upload a pdf file successfully", async () => {
    const fixture = path.join(__dirname, "fixtures", "test.pdf");
    const res = await request(app)
      .post("/api/tutor/study-materials/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", fixture)
      .field("title", "Test PDF")
      .field("description", "Test upload description")
      .field("subjects", "Math,Physics");

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(res.body).toHaveProperty("material");
    const mat = res.body.material;
    expect(mat.title).toBe("Test PDF");
    // check listing endpoint returns it
    const listRes = await request(app).get("/api/study-materials");
    expect(listRes.status).toBe(200);
    const found = (listRes.body || []).some((m) => m.title === "Test PDF");
    expect(found).toBe(true);
    // check file exists on disk
    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      "study-materials",
      mat.filePath || ""
    );
    const exists = fs.existsSync(filePath);
    expect(exists).toBe(true);
    // cleanup file
    if (exists) fs.unlinkSync(filePath);
  }, 20000);

  test("delete a material via API", async () => {
    // create a fake file entry
    const mat = await StudyMaterial.create({
      tutor: tutor._id,
      title: "To Delete",
      description: "will be deleted",
      type: "pdf",
      filePath: `tmp-${Date.now()}.txt`,
      subjects: ["Math"],
    });
    // create the actual file so the delete handler removes it
    const fp = path.join(
      __dirname,
      "..",
      "uploads",
      "study-materials",
      mat.filePath
    );
    fs.writeFileSync(fp, "delete me");
    const delRes = await request(app)
      .delete(`/api/tutor/study-materials/${mat._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(delRes.status).toBeGreaterThanOrEqual(200);
    const existsAfter = fs.existsSync(fp);
    expect(existsAfter).toBe(false);
  });

  test("update a material via API", async () => {
    const mat = await StudyMaterial.create({
      tutor: tutor._id,
      title: "To Update",
      description: "original",
      type: "link",
      url: "https://example.com",
      subjects: ["Math"],
    });

    const res = await request(app)
      .put(`/api/tutor/study-materials/${mat._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Updated Title",
        description: "updated",
        subjects: ["Physics"],
      });

    expect(res.status).toBeGreaterThanOrEqual(200);
    const updated = await StudyMaterial.findById(mat._id);
    expect(updated.title).toBe("Updated Title");
    expect(updated.description).toBe("updated");
    expect(Array.isArray(updated.subjects) && updated.subjects[0]).toBe(
      "Physics"
    );
    // cleanup
    await StudyMaterial.deleteOne({ _id: mat._id });
  });
});
