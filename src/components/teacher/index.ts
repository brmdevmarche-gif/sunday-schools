// Teacher Dashboard Components
// Export all teacher-specific components for easy importing

export { StatCard, StatCardSkeleton, statCardVariants } from "./StatCard";
export type { StatCardProps, StatCardIconName } from "./StatCard";

export {
  ActionRequiredCard,
  ActionRequiredCardSkeleton,
  ActionRequiredSection,
  actionRequiredTypeConfig,
} from "./ActionRequiredCard";
export type {
  ActionRequiredCardProps,
  ActionRequiredType,
} from "./ActionRequiredCard";

export {
  QuickAttendanceButton,
  QuickAttendanceButtonSkeleton,
} from "./QuickAttendanceButton";
export type {
  QuickAttendanceButtonProps,
  ClassSummary,
} from "./QuickAttendanceButton";

export { TeacherBottomNav, TeacherBottomNavSpacer } from "./TeacherBottomNav";
export type { TeacherBottomNavProps, NavItem } from "./TeacherBottomNav";

export { ClassCard, ClassCardSkeleton, classCardVariants } from "./ClassCard";
export type { ClassCardProps } from "./ClassCard";

export {
  ApprovalCard,
  ApprovalCardSkeleton,
  approvalTypeConfig,
} from "./ApprovalCard";
export type { ApprovalCardProps, ApprovalType } from "./ApprovalCard";

export { RejectionReasonModal, predefinedReasons } from "./RejectionReasonModal";
export type { RejectionReasonModalProps } from "./RejectionReasonModal";

export { StudentDrawer, StudentDrawerSkeleton } from "./StudentDrawer";
export type { StudentDrawerProps, StudentDetails } from "./StudentDrawer";

export { StudentProfileTab } from "./StudentProfileTab";
export { StudentPointsTab } from "./StudentPointsTab";
export { StudentAttendanceTab } from "./StudentAttendanceTab";

export {
  AttendanceStatusButton,
  AttendanceStatusGroup,
  attendanceStatusButtonVariants,
  statusConfig as attendanceStatusConfig,
} from "./AttendanceStatusButton";
export type {
  AttendanceStatusButtonProps,
  AttendanceStatusGroupProps,
  AttendanceStatus,
} from "./AttendanceStatusButton";

export {
  AttendanceStudentRow,
  AttendanceStudentRowSkeleton,
} from "./AttendanceStudentRow";
export type { AttendanceStudentRowProps } from "./AttendanceStudentRow";

export {
  AttendanceHeader,
  AttendanceHeaderSkeleton,
} from "./AttendanceHeader";
export type {
  AttendanceHeaderProps,
  AttendanceStats,
} from "./AttendanceHeader";

export {
  AnnouncementCard,
  AnnouncementCardSkeleton,
  announcementCardVariants,
  announcementTypeConfig,
} from "./AnnouncementCard";
export type {
  AnnouncementCardProps,
  AnnouncementType,
} from "./AnnouncementCard";

export {
  AnnouncementDetail,
  AnnouncementDetailSkeleton,
} from "./AnnouncementDetail";
export type {
  AnnouncementDetailProps,
  AnnouncementDetailData,
} from "./AnnouncementDetail";

export { TripCard, TripCardSkeleton } from "./TripCard";
export type { TripCardProps, TripCardData } from "./TripCard";

export { SearchCommand, SearchTrigger, useSearchShortcut } from "./SearchCommand";

export { TeacherHeader } from "./TeacherHeader";
