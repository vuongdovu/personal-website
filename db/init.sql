CREATE TABLE Photo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    title VARCHAR()
    caption VARCHAR()
    created_at DATE DEFAULT CURRENT_DATE
    updated_at DATE DEFAULT CURRENT_DATE
    tags
    s3_url VARCHAR()
    FOREIGN KEY (FolderID) REFERENCES Folder(FolderID) 
)

CREATE TABLE Folder (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    title VARCHAR()
    created_at DATE DEFAULT CURRENT_DATE
    updated_at DATE DEFAULT CURRENT_DATE 
)