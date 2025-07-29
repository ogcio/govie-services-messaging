enum MessagePermissions {
  Read = "messaging:message:read",
  Write = "messaging:message:write",
}

enum MessageOnboardingPermissions {
  Read = "messaging:message.onboarding:read",
}

enum MessageSelfPermissions {
  Read = "messaging:message.self:read",
  Write = "messaging:message.self:write",
}

enum ProviderPermissions {
  Read = "messaging:provider:read",
  Write = "messaging:provider:write",
  Delete = "messaging:provider:delete",
}

enum TemplatePermissions {
  Read = "messaging:template:read",
  Write = "messaging:template:write",
  Delete = "messaging:template:delete",
}

enum EventPermissions {
  Read = "messaging:event:read",
}

enum SchedulerPermissions {
  Write = "scheduler:jobs:write",
}

const OnboardedCitizenPermission = "profile:user:onboarded";

export const Permissions = {
  Message: MessagePermissions,
  MessageOnboarding: MessageOnboardingPermissions,
  MessageSelf: MessageSelfPermissions,
  Provider: ProviderPermissions,
  Template: TemplatePermissions,
  Event: EventPermissions,
  Scheduler: SchedulerPermissions,
  OnboardedCitizen: OnboardedCitizenPermission,
};
