
import { Result } from "../../../shared/core/result"
import { ValueObject } from "../../../shared/domain/valueObject"

interface CommentProps {
  value: string;
}

export class Comment extends ValueObject<CommentProps> {

  private constructor (props: CommentProps) {
    super(props);
  }

  public static isValidComment (comment: string) {
    return comment.length >= 2;
  }

  public static create (comment: string): Result<Comment> {
    if (!this.isValidComment(comment)) {
      return Result.fail<Comment>('Invalid Comment')
    }

    return Result.ok<Comment>(new Comment({ value: comment }))
  }

}