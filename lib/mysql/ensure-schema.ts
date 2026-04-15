import pool from './connection';

let ensureSchemaPromise: Promise<void> | null = null;

export function ensureAdminSchema() {
  if (!ensureSchemaPromise) {
    ensureSchemaPromise = (async () => {
      const connection = await pool.getConnection();

      try {
        const [userStatusColumn]: any = await connection.execute("SHOW COLUMNS FROM users LIKE 'status'");
        if (userStatusColumn.length === 0) {
          await connection.execute(
            `ALTER TABLE users
             ADD COLUMN status ENUM('active', 'inactive') NOT NULL DEFAULT 'active'`
          );
        }

        const [userRoleColumn]: any = await connection.execute("SHOW COLUMNS FROM users LIKE 'role'");
        if (userRoleColumn.length === 0) {
          await connection.execute(
            `ALTER TABLE users
             ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user'`
          );
        }

        const [embeddedColumn]: any = await connection.execute("SHOW COLUMNS FROM forms LIKE 'is_embedded'");
        if (embeddedColumn.length === 0) {
          await connection.execute(
            `ALTER TABLE forms
             ADD COLUMN is_embedded BOOLEAN DEFAULT FALSE`
          );
        }

        const [bannerColumn]: any = await connection.execute("SHOW COLUMNS FROM forms LIKE 'banner_url'");
        if (bannerColumn.length === 0) {
          await connection.execute(
            `ALTER TABLE forms
             ADD COLUMN banner_url LONGTEXT NULL`
          );
        }

        const [settingsColumn]: any = await connection.execute("SHOW COLUMNS FROM forms LIKE 'settings'");
        if (settingsColumn.length === 0) {
          await connection.execute(
            `ALTER TABLE forms
             ADD COLUMN settings JSON NULL`
          );
        }

        const [submissionSourceColumn]: any = await connection.execute("SHOW COLUMNS FROM responses LIKE 'submission_source'");
        if (submissionSourceColumn.length === 0) {
          await connection.execute(
            `ALTER TABLE responses
             ADD COLUMN submission_source ENUM('direct', 'embed') NOT NULL DEFAULT 'direct'`
          );
        }

        const [editTokenColumn]: any = await connection.execute("SHOW COLUMNS FROM responses LIKE 'edit_token'");
        if (editTokenColumn.length === 0) {
          await connection.execute(
            `ALTER TABLE responses
             ADD COLUMN edit_token VARCHAR(64) NULL`
          );
        }

        const [quizScoreColumn]: any = await connection.execute("SHOW COLUMNS FROM responses LIKE 'quiz_score'");
        if (quizScoreColumn.length === 0) {
          await connection.execute(
            `ALTER TABLE responses
             ADD COLUMN quiz_score DECIMAL(10,2) NULL`
          );
        }

        const [quizMaxScoreColumn]: any = await connection.execute("SHOW COLUMNS FROM responses LIKE 'quiz_max_score'");
        if (quizMaxScoreColumn.length === 0) {
          await connection.execute(
            `ALTER TABLE responses
             ADD COLUMN quiz_max_score DECIMAL(10,2) NULL`
          );
        }

        const [billingColumn]: any = await connection.execute("SHOW COLUMNS FROM users LIKE 'billing_plan'");
        if (billingColumn.length === 0) {
          await connection.execute(
            `ALTER TABLE users
             ADD COLUMN billing_plan ENUM('free', 'paid') NOT NULL DEFAULT 'free'`
          );
        }

        await connection.execute(
          `CREATE TABLE IF NOT EXISTS form_templates (
            id VARCHAR(36) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            questions JSON NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )`
        );

        await connection.execute(
          `CREATE TABLE IF NOT EXISTS smtp_settings (
            id INT PRIMARY KEY AUTO_INCREMENT,
            host VARCHAR(255) NOT NULL,
            port INT NOT NULL,
            user VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            secure BOOLEAN DEFAULT TRUE,
            from_email VARCHAR(255) NOT NULL,
            from_name VARCHAR(255) NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )`
        );

        const [smtpAdminEmailColumn]: any = await connection.execute("SHOW COLUMNS FROM smtp_settings LIKE 'admin_email'");
        if (smtpAdminEmailColumn.length === 0) {
          await connection.execute(
            `ALTER TABLE smtp_settings
             ADD COLUMN admin_email VARCHAR(255) NULL`
          );
        }

        await connection.execute(`UPDATE users SET status = 'active' WHERE status IS NULL`);
        await connection.execute(`UPDATE users SET role = 'user' WHERE role IS NULL`);
        await connection.execute(`UPDATE users SET billing_plan = 'free' WHERE billing_plan IS NULL`);
        await connection.execute(`UPDATE responses SET submission_source = 'direct' WHERE submission_source IS NULL`);

        const [formsUserIndex]: any = await connection.execute("SHOW INDEX FROM forms WHERE Key_name = 'idx_forms_user_id'");
        if (formsUserIndex.length === 0) {
          await connection.execute(`CREATE INDEX idx_forms_user_id ON forms (user_id)`);
        }

        const [questionsFormIndex]: any = await connection.execute("SHOW INDEX FROM questions WHERE Key_name = 'idx_questions_form_id'");
        if (questionsFormIndex.length === 0) {
          await connection.execute(`CREATE INDEX idx_questions_form_id ON questions (form_id)`);
        }

        const [responsesFormIndex]: any = await connection.execute("SHOW INDEX FROM responses WHERE Key_name = 'idx_responses_form_id'");
        if (responsesFormIndex.length === 0) {
          await connection.execute(`CREATE INDEX idx_responses_form_id ON responses (form_id)`);
        }

        const [answersResponseIndex]: any = await connection.execute("SHOW INDEX FROM answers WHERE Key_name = 'idx_answers_response_id'");
        if (answersResponseIndex.length === 0) {
          await connection.execute(`CREATE INDEX idx_answers_response_id ON answers (response_id)`);
        }

        const [responsesEditTokenIndex]: any = await connection.execute("SHOW INDEX FROM responses WHERE Key_name = 'idx_responses_edit_token'");
        if (responsesEditTokenIndex.length === 0) {
          await connection.execute(`CREATE INDEX idx_responses_edit_token ON responses (edit_token)`);
        }
      } finally {
        connection.release();
      }
    })();
  }

  return ensureSchemaPromise;
}
