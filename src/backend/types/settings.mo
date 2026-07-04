module {
  public type Mode = {
    #Beginner;
    #Intermediate;
    #Advanced;
    #Optional;
    #PowerUser;
  };

  public type UserSettings = {
    mode : Mode;
    onboardingComplete : Bool;
  };
};
