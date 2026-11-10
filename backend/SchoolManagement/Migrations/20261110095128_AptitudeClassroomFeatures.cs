using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Migrations
{
    public partial class AptitudeClassroomFeatures : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DepartmentId",
                table: "Teacher",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Teacher",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsSuperAdmin",
                table: "Teacher",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsSubmitted",
                table: "StudentExam",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "NetScore",
                table: "StudentExam",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "TotalNegativePenalty",
                table: "StudentExam",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "TotalPositiveScore",
                table: "StudentExam",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "TotalTimeSpentSeconds",
                table: "StudentExam",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<int>(
                name: "Choice",
                table: "StudentAnswer",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<bool>(
                name: "IsMarkedForReview",
                table: "StudentAnswer",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUpdated",
                table: "StudentAnswer",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "TimeSpentSeconds",
                table: "StudentAnswer",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Difficulty",
                table: "ExamQuestion",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Explanation",
                table: "ExamQuestion",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "NegativeMarks",
                table: "ExamQuestion",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "PositiveMarks",
                table: "ExamQuestion",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "Section",
                table: "ExamQuestion",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "EnableNegativeMarking",
                table: "Exam",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasLiveVideo",
                table: "Exam",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "VideoIframeUrl",
                table: "Exam",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoInstructions",
                table: "Exam",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Teacher_DepartmentId",
                table: "Teacher",
                column: "DepartmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Teacher_Department_DepartmentId",
                table: "Teacher",
                column: "DepartmentId",
                principalTable: "Department",
                principalColumn: "Id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Teacher_Department_DepartmentId",
                table: "Teacher");

            migrationBuilder.DropIndex(
                name: "IX_Teacher_DepartmentId",
                table: "Teacher");

            migrationBuilder.DropColumn(
                name: "DepartmentId",
                table: "Teacher");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Teacher");

            migrationBuilder.DropColumn(
                name: "IsSuperAdmin",
                table: "Teacher");

            migrationBuilder.DropColumn(
                name: "IsSubmitted",
                table: "StudentExam");

            migrationBuilder.DropColumn(
                name: "NetScore",
                table: "StudentExam");

            migrationBuilder.DropColumn(
                name: "TotalNegativePenalty",
                table: "StudentExam");

            migrationBuilder.DropColumn(
                name: "TotalPositiveScore",
                table: "StudentExam");

            migrationBuilder.DropColumn(
                name: "TotalTimeSpentSeconds",
                table: "StudentExam");

            migrationBuilder.DropColumn(
                name: "IsMarkedForReview",
                table: "StudentAnswer");

            migrationBuilder.DropColumn(
                name: "LastUpdated",
                table: "StudentAnswer");

            migrationBuilder.DropColumn(
                name: "TimeSpentSeconds",
                table: "StudentAnswer");

            migrationBuilder.DropColumn(
                name: "Difficulty",
                table: "ExamQuestion");

            migrationBuilder.DropColumn(
                name: "Explanation",
                table: "ExamQuestion");

            migrationBuilder.DropColumn(
                name: "NegativeMarks",
                table: "ExamQuestion");

            migrationBuilder.DropColumn(
                name: "PositiveMarks",
                table: "ExamQuestion");

            migrationBuilder.DropColumn(
                name: "Section",
                table: "ExamQuestion");

            migrationBuilder.DropColumn(
                name: "EnableNegativeMarking",
                table: "Exam");

            migrationBuilder.DropColumn(
                name: "HasLiveVideo",
                table: "Exam");

            migrationBuilder.DropColumn(
                name: "VideoIframeUrl",
                table: "Exam");

            migrationBuilder.DropColumn(
                name: "VideoInstructions",
                table: "Exam");

            migrationBuilder.AlterColumn<int>(
                name: "Choice",
                table: "StudentAnswer",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }
    }
}
